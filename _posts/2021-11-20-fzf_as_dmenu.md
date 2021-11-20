---
layout: post
title: Using fzf as a dmenu replacement
tags: workflow
---

Recently I needed to set up a fresh arch installation. While going through my regular packages, I got a sudden urge to get rid of rofi and try to bend a vanilla dmenu to my needs. Needless to say, dmenu on its own doesn't have any capabilities other than executing whatever command you put (or select) in it. However, that's expected because of dmenu's suckless nature. It is possible to improve the capabilities of dmenu; it's just that you have to **apply them as source patches and recompile dmenu** [[1]](https://tools.suckless.org/dmenu/patches/). There's also the dmenu2 available in AUR for those who do not want to deal with the process.

While going through scripts on the internet to see how much I can stretch dmenu, I came across a strange title that looked very interesting: ["Using FZF instead of DMENU"](https://medium.com/njiuko/using-fzf-instead-of-dmenu-2780d184753f). The author set up a floating terminal window with fzf and use it as a dmenu replacement. fzf's simplicity seems to be its greatest strength here, it's able to act as a simple menu with a very powerful fuzzy selection feature without any additional configuration. Since I was already using it in vim and ranger, it could help me get rid of another dependency for my workflow.

I wanted to get the functionality on my setup, so I got to work.


## fzf as a program selector

fzf can easily be used to select from a range of options as dmenu does by just supplying the list from stdin.

```
compgen -c | fzf
```

{% include aligner.html images="fzf/fzf1.png" column=1 %}

`compgen -c` generates a list of commands that can be completed. By piping the list to fzf, a menu is generated and from this menu we can search and select the command we want. fzf prints the selected entry to stdout, then we handle the output according to our needs. For example, to execute the selected entry:

```
compgen -c | fzf | sh
```

It's as simple as putting an additional pipe to sh.


## fzf inside a popup terminal

The terminal setup will depend on the software and differ accross setups. I'm currently using alacritty on top of i3wm. Firstly, it's necessary to find a way to spawn a floating alacritty window. To be able to do it, it's necessary to assign a specific window class to floating mode.

```
for_window [class="Alacritty" instance="floating-term"] floating enable
```

i3wm will now spawn alacritty in floating mode whenever it's a "floating-term" instance. Secondly, a keybind is assigned to call alacritty with this specific class name:

```
bindsym $mod+space exec alacritty --class floating-term -e ~/run_fzf.sh
```

{% include aligner.html images="fzf/fzf2.png" column=1 %}

I placed the commands to run fzf inside a script to not cause clutter in the config file. The only thing left to do is to fill `run_fzf.sh` and we'll be ready to go.


## spawning programs from a popup terminal

Here's where things get kinda quirky. Executing programs from a terminal is not as easy as piping its name to `sh` when all you want to see is the program itself and not a popup thats hanging in the center of your screen.

{% include aligner.html images="fzf/fzf3.png" column=1 %}

This happens because the spawned program is a child process of the shell in the popup terminal. Its stdio and signal handlers are all bound to the shell, that's why when we try to close the terminal using Ctrl-C, the program disappears too. There are solutions to this problem, namely [the "nohup, disown and &" trio](https://unix.stackexchange.com/questions/3886/difference-between-nohup-disown-and), however none of these actually helped in my case. Believe me, I tried.

It is seemingly impossible to disown the spawned process and close the popup terminal without a solution written specifically for this (as the author has done). Now, I did not want to rely on a custom solution so I started looking for something that was already available on my system.


## "it-who-shall-not-be-named"-run to the rescue

A big part of the linux community has their reservations with systemd (and [rightly so](http://web.archive.org/web/20140909093139/http://boycottsystemd.org/)), however it served me very well with its utility `systemd-run` in this case. It is possible to execute a command through systemd and keep it attached to an already-running process that is independent of our popup terminal. To spawn the process as the current user, `--user` flag is used.

```
#!/bin/bash

exec systemd-run --user $(compgen -c | fzf)
```

With this I solved the problem in a simple way. On to writing scripts for my workflows using fzf...
