---
layout: post
title: Adding new features to an old game using Frida
tags: re frida
---

I've been interested in dynamic instrumentation for a long while now. This
interest however, has not been turned into practical experience until very
recently; when I finally decided to use Frida seriously on a project. I wanted
to explore what Frida had to offer, while working on a project that I can
showcase.

The opportunity presented itself when I got my hands on a game that I played in
my childhood: Mystery PI from SpinTop Games (and released by PopCap Games). It's
a puzzle game where the player finds listed objects hidden in a given frame. It
was a lot of fun back then, except that I couldn't progress through levels
because I didn't understand most of the words. This time I was able to breeze
through them and after completing the game I wanted to take a look under the
hood.

{% include aligner.html images="/frida-mysterypi/mpi1.png" width=100 %}

I already wanted to approach it as a project, so I set myself up with some
goals. The game doesn't allow resizing in windowed mode and its fixed at a a
800x600 resolution, so I wanted to enable resizing in windowed mode as the first
step. Of course the next step was to enable more "hints" :). Then finally, I
wanted to implement some sort of multiplayer feature just for the kick of it.

As of writing this, the first goal is achieved. In this first post of (what I
think is going to be) three, I'll walk through the basics of the game's
implementation and how I instrumented it with Frida to scale its window.

## initial analysis

Initial analysis (quickly skimming through strings) shows that the game is built
on SDL. Since the game is released in 2007, it is a strong possibility that its
not SDL2 but an older version. Later analysis shows that it's SDL1.2 (patch
level 9).

First thing to notice is that there are almost no dependencies. Most of the
libraries are statically linked and stripped, making the initial phase a bit
hard. I'm also guilty of not having used a plugin to automatically name library
functions. Though it wasn't that bad of a nuisance to go through since most of
SDL functions reference at least one error string, therefore really trivial to
figure out which is which. I named them manually as I went along.

The game comes with a library named `Resources.dll`. Opening it up with GHIDRA
revealed pretty much every asset the game uses. Then I used `pefile` to dump all
the resources. The dump includes images, sounds, fonts and even some xml files
that I later learned is in [MSL] (Mapping Specification Language) format. These
files are used as plaintext databases for the assets, menu and level layouts
etc. Even all of the objects' coordinates on the screen can be found in these
files.

{% include aligner.html images="/frida-mysterypi/rsrc.png" width=100 %}

The game saves player data, highscores and options in `ProgramData\SpinTop
Games\Mystery PI\PopCapv1005`. These files have the same format as the ones in
`Resources.dll`, which means that they are in plaintext.

{% include aligner.html images="/frida-mysterypi/playerfile.png" width=100 %}

[MSL]: https://sqlprotocoldoc.blob.core.windows.net/productionsqlarchives/MS-MSL/%5bMS-MSL%5d.pdf

## warming up

I haven't used frida for native instrumentation before (except for the time I
used gum-devkit to build a harness), so I wanted to hook some simple
functionality to get used to the syntax and the capabilities.

### hooking fopen

I found the function the game uses to save player files. The Interceptor api is
the bread and butter of Frida, so let's put it to use by hooking the `fopen`
function called inside. Now, I don't want to hook every single `fopen` call so
I hooked the instruction that calls it.

{% include aligner.html images="/frida-mysterypi/fopen1.png" width=100 %}

Since the function call is not completed yet, the `args` argument of `onEnter`
callback would not provide a correct view of the function arguments. Instead I
fetched the pointer straight from `eax` register:

```js
// hook fopen while saving a player
Interceptor.attach(ptr("0x405BDC"), {
    onEnter: function (args) {
        send({
            fname_buffer: this.context.eax,
            fname: this.context.eax.readAnsiString()
        });
    }
})
```

{% include aligner.html images="/frida-mysterypi/fopen2.gif" width=100 %}

After this simple hook, I wanted to spice things up with a call to the game's
own functions. For that I chose to work out how to toggle fullscreen.

### toggling fullscreen

According to an SDL1.2 tutorial, the display is configured with a
`SDL_SetVideoMode` call. 

```cpp
SDL_Surface * SDL_SetVideoMode (int width, int height, int bpp, Uint32 flags)
```

Looking for this call in the game's main function resulted in a couple functions
that are called back-to-back. Looking the values being passed, I determined the
values required to enable fullscreen. I put these calls in the exports so that I
can toggle fullscreen at will.

<!-- TODO add decompiled output -->

```js
rpc.exports = {
    setDisplay(flag) {
        var ctx = getContext();
        var setDisplay = new NativeFunction(ptr(0x401a50), "void", ["uint8", "pointer"]);
        var setFullscreen = new NativeFunction(ptr(0x40fc50), "void", ["pointer", "uint8"], "thiscall");

        setDisplay(flag, ctx);
        setFullscreen(ctx, flag);
    }
}
```
<!-- TODO add python side of the call -->
<!-- TODO add gif, but how to show fullscreen? -->

## live-patching the windowed mode

The `SDL_SetVideoMode` call is also used to set the resolution. It is possible
to force the game into a custom resolution by hooking this function and playing
with the parameters. I tested it with 1600x1200 resolution.

```js
Interceptor.attach(ptr(0x0046B6E0), {
    onEnter: function (args) {
        args[0] = ptr(1600);
        args[1] = ptr(1200);
        // add resizable flag
        // args[3] = ptr(0x00000010);
        send({
            hook_name: "SDL_SetVideoMode",
            width: args[0],
            height: args[1],
            bpp: args[2],
            flags: args[3],
        })
    },
}
```

<!-- TODO add output gif -->

The output shows that the game is still running at 800x600, combined with the
fact that coordinates are hardcoded in `.mse` files, it is painfully obvious
that the game wouldn't be cooperative in my quest. After this I focused solely
on the video subsystem.

Since setting the resolution by itself is not enough, the video output should
also match. My first thought was if the video subsystem supported scaling the
output, to which the answer at this time was a no. None of the tutorials,
discussions on the web, even the API reference acknowledged the existence of
scaling, stretching or resizing the output in any way. This bit is important as
I'll come back to it later in this post.

It seemed that the time had come to start implementing a custom routine to scale
the output myself. To that end I started looking at my options:

- implement a custom routine by hand
    - in js
    - in c
- find a native implementation and embed it

First I wanted to play around for a bit, so I started with a javascript
implementation.

### where to hook the subsystem

At this point I had a general conception of what I wanted to do, but no idea of
how to do it in practise. From what I gathered in SDL tutorials, objects are
"blitted" onto a "surface" in each loop iteration, then the surface is
"flipped", meaning that it is updated in the hardware to be shown on the
display.

<!-- TODO add sdl loop diagram -->