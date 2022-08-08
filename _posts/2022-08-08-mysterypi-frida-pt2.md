---
layout: post
title: Adding new features to an old game with Frida, Part II
tags: re frida
---

In this second part of my reverse engineering project where I've been analysing
Mystery PI and instrumenting it with Frida, I wanted to develop some cheats for
the game. Reverse engineering a game and not dropping cheats would make no sense
at all, so I went to work.

The game provides the player with a hint button, which highlights a random
object listed in the left of the screen. Obviously it's the quickest way to
figure out the important part of the game's logic.

## sdl function table

At this point I only knew about the function table the game used to call SDL
functions.

{% include aligner.html images="/mysterypi-frida-pt2/sdlfcntable.png" width=75 %}

I had decoded some of the functions in my previous analyses but most of the
table entries were still unknown. Since animations are a big part of this game,
I thought it would be a good idea to use that to figure out the hidden objects
and eventually hints. So I loaded these functions into frida and started tracing
using a naive approach.

Using the trace, I identified the hot functions and eliminated them manually
then focused on the rest. I found a function at offset 0x4615c0 that was being
called multiple times after finding an object. I noticed the correlation with
the item being zoomed out and in before starting to move up. I confirmed my
assumptions when I checked it out. I named this function `zoomObject`.

{% include video.html source="/mysterypi-frida-pt2/zoomobject.mp4" %}

## class initializer

Although I was able to understand the game a bit more, the SDL function table
was unfortunately a deadend. I wasn't able to find any other function exclusive
to successful clicks or hints. On the other hand, I discovered a parser function
while looking for the string `hint` in the binary.

{% include aligner.html images="/mysterypi-frida-pt2/parsegameobjects.png" width=50 %}

This is the function where classes are created to hold the objects found in
`.mse` files in `Resources.dll`. It's an extremely useful code because it
reveals object sizes and constructors of each game class.

## hints

Going through classes in the initializer function, I identified the ones that
needed my attention. I caught the string `eyespyhint` in the code, marked the
constructor and analyzed the class methods. The vftable does not pack a lot of
functions but the functions were long and complex, so it took some time to
figure them out.

{% include aligner.html images="/mysterypi-frida-pt2/hintclass.png" width=80 %}

I found the offsets where time information is kept after the hint button is
activated. The numbers at offsets 228 and 232 indicate the time passed after a
click and the time required to reactivate the button. I added an api call to
reset the timer by setting the time passed above the time required, which is
capped at 67.5.

```js
class Hint {
    constructor (addr) {
        if (addr == 0) {
            return null;
        }
        this.addr = addr;
        this.fcnTable = addr.readPointer();
    }

    get onCooldown () {
        return this.addr.add(224).readU8();
    }

    get currTime () {
        return this.addr.add(228).readFloat();
    }

    set currTime (val) {
        this.addr.add(228).writeFloat(val);
    }
}
```

{% include video.html source="/mysterypi-frida-pt2/resethint.mp4" %}

The hint button creates a blue animation. After establishing control over the
hint timer, I immediately turned my focus on the animations. Since the animation
is created exactly on top of a listed object and the object is randomly
selected, I thought it could provide me with the information about how to find
the listed objects on the screen.

I hooked the constructor function to track hint objects. Since there's only one
object of this class in use, it was easy to accomplish. It would make more sense
to use the class enum and its vftable as a pattern to find it in memory in
runtime, but since I spawned the game with the script it didn't matter in this
case.

```js
Interceptor.attach(ptr(0x0041EB70), {
    onLeave: function (ret) {
        send({
            hook: "HintClass",
            addr: ptr(ret),
        })
        if (!hint) {
            hint = new Hint(ptr(ret));
        }
    }
})
```

The last thing to do was finding out what the vftable held. After spending a
considerable time in these functions I decoded most of the functions. The most
interesting one among these functions is the one I named `getHint`, as the
object to highlight is selected in that function.

## selecting random objects

The function at `0x41eff0` that is `getHint` is called once when a hint is
taken. In this function another call is made to the function at offset
`0x41a640` that I named `executeHint` which is a large function. At first glance
I saw a couple `rand` calls, which is a good indication.

At this point I knew that I was at the right track but was also a bit lost
because there were a few loops in the code that I didnt know what for. I started
decoding the function from the beginning.

{% include aligner.html images="/mysterypi-frida-pt2/executehint.png" width=70 %}

There was a function call in the beginning of the function, after opening it I
saw the string reference to `- 7,500` and identified the function as the
function where the number deduction happens. This function also triggers a popup
right next to the cursor. By hooking this function I was able to pop up a string
of my choosing.

{% include aligner.html images="/mysterypi-frida-pt2/hintpopup.png" width=60 %}

The function at `0x420260` returns a buffer holding three values. First is a
pointer to an array of pointers to objects. The second value is the number of
current number of objects that are listed. The function takes the hint class as
`this`, so I was able to call the function on-the-fly whenever I wanted.

```js
class Hint {
    constructor (addr) {
        if (addr == 0) {
            return null;
        }
        this.addr = addr;
        this.fcnTable = addr.readPointer();
    }

    get onCooldown () {
        return this.addr.add(224).readU8();
    }

    get currTime () {
        return this.addr.add(228).readFloat();
    }

    set currTime (val) {
        this.addr.add(228).writeFloat(val);
    }

    // access through the function
    get activeSetInfo () {
        let fcn = new NativeFunction(ptr(0x00420260), 
            "pointer", 
            ["pointer", "pointer"], 
            "thiscall"
            );
        let buf = Memory.alloc(12);
        let _info = fcn(this.addr.add(216).readPointer().add(100).readPointer(), buf);

        // data to return
        let objects = new Array();
        
        // push active objects
        let objBufPtr = buf.readPointer();
        let objCount = buf.add(4).readU32();
        if (objBufPtr != ptr(0)) {
            for (let i=0; i<objCount; i++) {
                objects.push(new Set(objBufPtr.add(i*4).readPointer()));
            }
        }

        // free the buffer inside our buffer
        if (buf.readU32()) {
            free(buf.readPointer());
        };

        return objects;
    }
}
```

After getting access to the objects, I proceeded to analyse the function
`executeHint` further. One of the objects returned by `getActiveSetInfo` is
selected with a `rand` call until a suitable one is found. Then there's a second
random selection. The second random call confused me at first, though I did
figure it out eventually. `getActiveSetInfo` returns a list of `Set` objects.
Each `Set` object with a name (`bird` for example) may actually refer to more
than one `Image`. The second random selection selects one of the active images
of the selected object.

With all this knowledge, I developed classes to parse these objects to access
them.

```js
class Set {
    // class enum 111
    constructor (addr) {
        if (addr == 0) {
            return null;
        }
        this.addr = ptr(addr);
    }

    get infoBuf () {
        let fcn = new NativeFunction(
            ptr(0x004210C0),
            "pointer",
            ["pointer", "pointer"],
            "thiscall"
        );

        let buf = Memory.alloc(0x10);
        fcn(this.addr, buf);
        
        return buf;
    }

    get info () {
        let buf = this.infoBuf;
        return {
            val0: buf.readPointer(),
            val1: buf.add(4).readPointer(),
            val2: buf.add(8).readPointer(),
            imgCount: buf.add(12).readU32(),
        }
    }

    getImage (offset) {
        let offsetBuf = Memory.alloc(4)
        offsetBuf.writeU32(offset);
        let rectBuf = Memory.alloc(0x10);

        let fcn = new NativeFunction(
            ptr(0x0041DF20),
            "pointer",
            ["pointer", "pointer", "pointer"],
            "thiscall"
        );

        return new Image(
            fcn(this.infoBuf, rectBuf, offsetBuf).readPointer().add(16).readPointer()
        );
    }
}

class Image {
    // class enum 108
    constructor (addr) {
        if (addr == 0) {
            return null;
        }
        this.addr = ptr(addr);
        this.getRGBA = new NativeFunction(
            ptr(0x0044340E), 
            "uint8", 
            ["pointer", "int", "int", "int"],
            "thiscall"
        );
    }

    get rect () {
        let fcn = new NativeFunction(
            this.addr.readPointer().add(16).readPointer(),
            "void",
            ["pointer", "pointer", "int"],
            "thiscall"
        );

        let buf = Memory.alloc(0x10);
        fcn(this.addr, buf, 0);
        return {
            x: buf.readS32(),
            y: buf.add(4).readS32(),
            w: buf.add(8).readU32(),
            h: buf.add(12).readU32()
        };
    }

    get isInactive () {
        return this.addr.add(144).readU8() == 1;
    }

    checkClick(x, y) {
        // check with the texture at this[17]
        return this.getRGBA(this.addr.add(17*4).readPointer(), x, y, 3)
    }
}
```

I had everything necessary to start autoclicking the listed objects. I created
an api call to iterate through the `Set` list and get all the `Image` object
coordinates and push mouse click events with `PushEvent` calls.

```js
let mouseClick = function (x, y) {
    let pushEvent = new NativeFunction(ptr(0x004643C0), "int", ["pointer"]);
    let buffer = Memory.alloc(8);

    // button down
    buffer.writeU8(5);
    buffer.add(1).writeU8(0);
    buffer.add(2).writeU8(1);
    buffer.add(3).writeU8(1);
    buffer.add(4).writeS16(x);
    buffer.add(6).writeS16(y);
    if (pushEvent(buffer) == -1) {
        send("pushevent error!")
    }

    // button up
    buffer.writeU8(6);
    buffer.add(1).writeU8(0);
    buffer.add(2).writeU8(1);
    buffer.add(3).writeU8(0);
    buffer.add(4).writeS16(x);
    buffer.add(6).writeS16(y);
    if (pushEvent(buffer) == -1) {
        send("pushevent error!")
    }
}

rpc.exports = {
    solve: function () {
        hint.activeSetInfo.map((x) => {
            let arr = new Array();
            for (let i=0; i<x.info.imgCount; i++) {
                let rect = x.getImage(i).rect;
                mouseClick(rect.x + Math.floor(rect.w/2), rect.y + Math.floor(rect.h/2));
            }
        });
    },
}
```

## dealing with rough edges

Initially everything looked to be in a working state, though the game started
behaving erratically without crashing in some cases. After a couple clears, the
game would become unresponsive.

{% include video.html source="/mysterypi-frida-pt2/unresponsive.mp4" %}

I tried to make sense of what was happenning and after an extensive examination
I found a couple erroneous points in my approach. The click coordinates were
calculated as center coordinates of objects and I later noticed that some
objects' centers weren't clickable.

{% include video.html source="/mysterypi-frida-pt2/solve.mp4" %}

To find out correct coordinates to successfully click on an object, I analyzed
the relevant functions and learned that for a click to be successful, the target
pixel should have a nonzero alpha value, which means that it should not be
completely invisible. I found the offset where the `Texture` object of an
`Image` object is at and the function to fetch the bytestream of the texture.
Then I used the bytestream to find a visible pixel by randomly trying clicks
offset from the center.

```js
class Image {
    checkClick(x, y) {
        // check with the texture at this[17]
        return this.getRGBA(this.addr.add(17*4).readPointer(), x, y, 3)
    }
}

rpc.exports = {
    solve: function () {
        hint.activeSetInfo.map((x) => {
            let arr = new Array();
            for (let i=0; i<x.info.imgCount; i++) {
                let rect = x.getImage(i).rect;
                let imgX = Math.floor(rect.w/2);
                let imgY = Math.floor(rect.h/2);
                while (img.checkClick(imgX, imgY) == 0) {
                    imgX = Math.floor(Math.random() * rect.w);
                    imgY = Math.floor(Math.random() * rect.h);
                }
                mouseClick(rect.x + imgX, rect.y + imgY);
            }
        });
    },
}
```

With this improvement I was able to solve a set, thus a level, with one command.

{% include video.html source="/mysterypi-frida-pt2/solve2.mp4" %}

The improvement unfortunately did not solve the issue. The game would still
become unresponsive after a couple clears. I thought the issue stemmed from the
event queue getting exhausted so I spent some time to debug the events. I ended
up not being able to figure it out.

After I retraced my steps, I noticed that some of the coordinates that I clicked
were not in the visible area; for example when an object sits at the edge of the
border, its center is offscreen and I thought maybe generating a click event on
an out-of-bounds coordinate caused the game to become unresponsive. I applied
the necessary sanitizations to coordinates.

```js
    if (clickX < 160) clickX = 160;
    if (clickX > 799) clickX = 799;
    if (clickY < 0)   clickY = 0;
    if (clickY > 599) clickY = 599;
```

In the meantime I was constantly being interrupted with the game freezing the
game when the window would go out of focus. I already knew about the `Unpause`
class, so I hooked it and disabled the pause.

```js
Interceptor.replace(ptr(0x0040E900), new NativeCallback((t) => {
    return;
}, "void", ["pointer"], "thiscall"));
```

In the list that `getActiveSetInfo` returns, `Set` objects hold every possible
image. This resulted in my returned buffer to hold images that are not used in
the current frame, causing me to generate clicks for images that do not exist.
When I checked their coordinates, they would be positioned way outside of the
center (generally y axis having a large negative number). After looking through
the checks in place, I found a flag that is used to check if an image is used in
the frame(at least thats how it correlated to my findings). I added this check
into my code.

All of these fixes did not resolve my issue in the end. However, I randomly
found a workaround while fiddling with the game; if at least one object in the
list is kept untouched, the unresponsiveness issue never happens. So I modified
my code to keep the first object until the end. I also wrote another api call to
click on objects with delay to accommoadate for the unlimited levels.

```js
solveAll: function () {
    let interval = setInterval(() => {
        let setInfo = hint.activeSetInfo;

        if (setInfo.length == 0) {
            send("solveAll done.");
            clearInterval(interval);
            return;
        }
        
        let imgArrays = setInfo.map((x) => {
            let arr = new Array();
            for (let i=0; i<x.info.imgCount; i++) {
                let img = x.getImage(i);
                if (!img.isInactive)
                    arr.push(img);
            }
            return arr;
        }).filter((a) => {
            return a.length > 0;
        });

        if (imgArrays.length > 1)
            imgArrays.splice(0, 1);
        
        for (let arr of imgArrays) {
            for (let img of arr) {
                let rect = img.rect;
                let imgX = Math.floor(rect.w/2);
                let imgY = Math.floor(rect.h/2);
                while (img.checkClick(imgX, imgY) == 0) {
                    imgX = Math.floor(Math.random() * rect.w);
                    imgY = Math.floor(Math.random() * rect.h);
                }

                let clickX = rect.x + imgX;
                let clickY = rect.y + imgY;

                if (clickX < 160) clickX = 160;
                if (clickX > 799) clickX = 799;
                if (clickY < 0)   clickY = 0;
                if (clickY > 599) clickY = 599;

                if (!img.isInactive) {
                    mouseClick(clickX, clickY);
                    return;
                }
            }
        }
    }, 400);
},
```

## matching puzzles between levels

To proceed to the next level the player must complete a minigame of three
possible types:

- match identical objects
- match objects of the same color
- match objects that are related

Of course without cheating my way out of these minigames, my work wouldn't be
complete. These games are based on these classes: `matchgame` and `matchboard`.
So I analyzed and traced their methods and found the check for successful
matches. This time I wanted to patch the code:

```js
const fixedJmp = function (addr, target) {
    const instr = Instruction.parse(addr);
    send(`jmp patch instruction at ${addr}: ${instr}`);
    Memory.patchCode(addr, 0x10, code => {
        const cw = new X86Writer(code, { pc: addr });
        cw.putJmpAddress(target);
    });
};

fixedJmp(ptr(0x0042C28D), ptr(0x0042C2C5));
fixedJmp(ptr(0x0042C29D), ptr(0x0042C2C5));
fixedJmp(ptr(0x0042C2A9), ptr(0x0042C2C5));
fixedJmp(ptr(0x0042C2BF), ptr(0x0042C2C5));
```

After the patch, I was able to click on any two random tiles and have them
successfully match, allowing me to quickly complete the minigame.

{% include video.html source="/mysterypi-frida-pt2/complete.mp4" %}

With all these "features" I was able finish the game in minutes, since the game
practically played itself most of the time. All in all it was really trivial to
instrument the game with Frida; I never felt the need to fall back to native
code, though that could be because I chose an old 2d game with almost no
performance requirements.

This concludes the scond part of this series. It's currently unclear if I'll do
a part 3. If I can come up with an idea that is interesting in terms of which
capabilities of Frida should be used, I will definitely do it. Until then.
