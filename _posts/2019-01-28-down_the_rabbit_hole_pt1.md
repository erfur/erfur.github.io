---
layout: post
title: "[EN] Down the Rabbit Hole - Part I: A Journey into the UEFI Land"
tags: re
date: 19.01.28
---

Ever since I bought a little X230 to use at school, I'm simply in love with Thinkpads. The build quality,
reliability and serviceability are just some of the aspects that draw me to these machines. They are not perfect;
however, I think they are right in the sweet spot in terms of getting what you want out of a laptop with just
the right amount of sacrifice. I've been using my T430 for about three years and it's still going strong in spite
of my relentless abuse, both physical and operational.

Of course I am not writing this to praise my laptop. In fact the story I'm about to tell you happened because of
a little mechanism called **whitelist** that prevents the computer from booting if it happens to have a device connected
that isn't in this list. A list that is embedded into the BIOS by the laptop's vendor(looking at you Lenovo!).

Since my T430 is a machine released in 2012, unfortunately its whitelist doesn't include any wifi card with 802.11ac support. I just cannot accept the fact that there are newer and better wifi cards out there that are 100% compatible with this machine, but aren't *allowed* to be used. Some rules obviously have to be bent here.

*In this blog series I will try to pass on my thought process on how I approached this as a reverse engineering task and to show how I used the tools at my disposal to solve it.*

## **A concise statement of the problem at hand**

I would like to bypass or remove the whitelist mechanism that is embedded into the BIOS of my T430. Currently it has the following wifi card attached:

```Intel Corporation Centrino Advanced-N 6205 [Taylor Peak] (rev 34)```

I want to upgrade this card to a wifi card that is newer, for example to an Intel 7260HMW Dual Band Wireless-AC.

## **Possible solutions**

There are actually more than one way to solve this problem:

  - [Modifying the wireless card's ID](http://www.thinkwiki.org/wiki/Problem_with_unauthorized_MiniPCI_network_card#Modifying_the_card.27s_ID)
  - [Modifying the BIOS of the computer](http://www.thinkwiki.org/wiki/Problem_with_unauthorized_MiniPCI_network_card#Modifying_the_BIOS)

## **My initial roadmap**

Since I wanted this to be a reverse engineering task, I chose to go with modifying my laptop's BIOS. Basically what I have to do is:

1. Read the contents of BIOS
2. Find and modify the whitelist mechanism *OR* find a modified image that has whitelist removed
3. Flash the BIOS back to where it belongs

While searching for ways to achieve these goals, I realized that things would get complicated from the get go. There are several reasons why:

- Recent models do not allow BIOS content to be read and written arbitrarily. The BIOS has to be dumped by reading the EEPROM using hardware.
- (T430 and newer models [I guess]) The EEPROM holds data that is unique to the machine. This eliminates the possibility of using another modified BIOS image.
- T430 has a UEFI BIOS, meaning that the BIOS content needs to be extracted and rebuilt after the modification.
- Only signed images can be flashed using software. Since the rebuilt image cannot be signed by me, it will have to be written back to the EEPROM with hardware.

Anyway, keeping these in mind, I begin my journey into the heart of my laptop.

# **Reading the contents of BIOS**

I've actually done this step some time ago. The dump file has been sitting in my drive for about a year. Only recently I could finish this project and start writing about it. I might update this section later to add more detail and visuals. For now, here is what I did:

1. Bought a few cheap USB EEPROM programmers
2. Located the BIOS chip on the machine (Had to tear it all down)
3. After burning the first programmer (not really experienced in electronics sorry), I successfully read the chip and dumped its contents (to a 4MB file)

# **Finding and modifying the whitelist mechanism(aka going down the rabbit hole)**

Now I have my BIOS in a file, but what even is it? ```file``` command doesn't tell me anything about it:

```
erfur@battlestation  ~/Downloads/t430-bios-mod  file t430_bios_updated.bin
t430_bios_updated.bin: data
```

```binwalk``` is somewhat more helpful:

```
erfur@battlestation  ~/Downloads/t430-bios-mod  binwalk t430_bios_updated.bin

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             UEFI PI firmware volume
105           0x69            LZMA compressed data, properties: 0x5D, dictionary size: 8388608 bytes, uncompressed size: 10551312 bytes
2988086       0x2D9836        Certificate in DER format (x509 v3), header length: 4, sequence length: 1495
2989629       0x2D9E3D        Certificate in DER format (x509 v3), header length: 4, sequence length: 1552
...
3010895       0x2DF14F        GIF image data, version "89a", 600 x 260
3905376       0x3B9760        Microsoft executable, portable (PE)
3907900       0x3BA13C        Microsoft executable, portable (PE)
...
```

```strings``` with default arguments shows nothing but garbage, and with ```strings -e l``` I only get a handful of strings:

```
erfur@battlestation  ~/Downloads/t430-bios-mod  strings -e l t430_bios_updated.bin
SystemSecure
System
TxtSetup
TdtSetup
AmtSetup
MeSetup
Setup
...
BootState
LenovoSecurityConfig
LenovoConfig
LenovoSystemConfig
PlatformStage2Pei.efi
SystemS3ResumePei.efi
DxeIpl
```

Thinking there's more to it, I proceed to learn about the structure of UEFI BIOS.

## **Know thy enemy: UEFI**

From [OSDev wiki](https://wiki.osdev.org/UEFI#UEFI_applications_in_detail):

    (U)EFI or (Unified) Extensible Firmware Interface is a specification for x86, x86-64, ARM, and Itanium platforms that defines a software interface between the operating system and the platform firmware/BIOS.

    UEFI vs. legacy BIOS
    A common misconception is that UEFI is a replacement for BIOS. In reality, both legacy motherboards and UEFI-based motherboards come with BIOS ROMs, which contain firmware that performs the initial power-on configuration of the system before loading some third-party code into memory and jumping to it. The differences between legacy BIOS firmware and UEFI BIOS firmware are where they find that code, how they prepare the system before jumping to it, and what convenience functions they provide for the code to call while running.

    Platform initialization
    On a legacy system, BIOS performs all the usual platform initialization (memory controller configuration, PCI bus configuration and BAR mapping, graphics card initialization, etc.), but then drops into a backwards-compatible real mode environment. The bootloader must enable the A20 gate, configure a GDT and an IDT, switch to protected mode, and for x86-64 CPUs, configure paging and switch to long mode.

    UEFI firmware performs those same steps, but also prepares a protected mode environment with flat segmentation and for x86-64 CPUs, a long mode environment with identity-mapped paging. The A20 gate is enabled as well.

    Additionally, the platform initialization procedure of UEFI firmware is standardized. This allows UEFI firmware to be extended in a vendor-neutral way.

[Wikipedia](https://en.wikipedia.org/wiki/Unified_Extensible_Firmware_Interface#Features) provides some more insight:

    Services
    EFI defines two types of services: boot services and runtime services. Boot services are available only while the firmware owns the platform (i.e., before the ExitBootServices call), and they include text and graphical consoles on various devices, and bus, block and file services. Runtime services are still accessible while the operating system is running; they include services such as date, time and NVRAM access. 

    Applications
    Beyond loading an OS, UEFI can run UEFI applications, which reside as files on the EFI System Partition. They can be executed from the UEFI command shell, by the firmware's boot manager, or by other UEFI applications. UEFI applications can be developed and installed independently of the system manufacturer. 

    Protocols
    EFI defines protocols as a set of software interfaces used for communication between two binary modules. All EFI drivers must provide services to others via protocols.

A little googling yields a [blog post on reverse engineering UEFI firmware](https://jbeekman.nl/blog/2015/03/reverse-engineering-uefi-firmware/) by Jethro Beekman, which was extremely helpful:

    UEFI firmware is made up of many different loadable modules (drivers, shared libraries, etc.), which are stored in the Portable Executable (PE) image format. These modules can be extracted from the image using Nikolaj Schlej’s excellent UEFIExtract (from UEFITool). Once you have all the PE modules, the real reversing can begin.

Armed with theoretical and practical knowledge, now I can tackle the BIOS dump with more courage.

## **Extracting UEFI Modules**

Using the aforementioned [UEFITool](https://github.com/LongSoft/UEFITool)(great tool btw), I extracted the modules and was greeted by hundreds of them. Many of them were automatically named by the tool. Module names were mostly self-explanatory, but nothing obvious came up. Now it's time to look for something that resembles a whitelist.

{% include aligner.html images="/2019-01-28-down_the_rabbit_hole_pt1/uefitool.png" width=100 %}

## **Locating the point of interest**

It is obviously not reasonable to try every single module to see if it leads to a whitelist mechanism. Now I will use the only solid lead I've got to pinpoint the location of whitelist: **An error message**:

{% include aligner.html images="/2019-01-28-down_the_rabbit_hole_pt1/error.png" width=100 %}

    1802: Unauthorized network card is plugged in - Power off and remove the miniPCI network card

I will proceed with the assumption that the module that holds this string will also be in charge of the whitelist. Luckily, searching for this string yields only one result:

{% include aligner.html images="/2019-01-28-down_the_rabbit_hole_pt1/uefitool_search.png" width=100 %}

I can see the string in hexview:

{% include aligner.html images="/2019-01-28-down_the_rabbit_hole_pt1/hex_view.png" width=100 %}

Time to extract the PE file and do some reversing. In the next post I will try to delve into this file with radare2, stay tuned!

*[1]  + 2453 suspended  blog*