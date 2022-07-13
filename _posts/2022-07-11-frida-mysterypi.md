---
layout: post
title: Adding new features to an old game using Frida
tags: re frida
---

I've been interested in dynamic instrumentation for a long while now. This
interest however, has not been turned into practical experience until very
recently; when I finally decided to use Frida seriously on a project. I wanted
explore what Frida had to offer, while working on a project that I can showcase.

The opportunity presented itself when I got my hands on a game that I played in
my childhood: Mystery PI from SpinTop Games (and released by PopCap Games). It's
a puzzle game where the player finds listed objects hidden in a given frame. It
was a lot of fun back then, except that I couldn't progress through levels
because I didn't understand most of the words. This time I was able to breeze
through them and after I completed the game I wanted to take a look under the
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
libraries are statically linked and stripped, making the inital phase a bit
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

{% include aligner.html images="/frida-mysterypi/rsrc.png" width=50 %}

The game saves player data, highscores and options in `ProgramData\SpinTop
Games\Mystery PI\PopCapv1005`. These files have the same format as the ones in
`Resources.dll`, which means that they are in plaintext.

{% include aligner.html images="/frida-mysterypi/playerfile.png" width=50 %}

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

{% include aligner.html images="/frida-mysterypi/fopen1.png" width=50 %}

Since the function call is not completed yet, the `args` argument would not
provide a correct view of the function arguments. Instead I fetched the pointer
straight from `eax` register:

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

After this simple hook, I wanted to spice things up with a function call inside
the game. For that I chose to work out how to toggle fullscreen.

### toggling fullscreen

TODO