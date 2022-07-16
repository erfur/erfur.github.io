---
layout: post
title: "[EN] Down the Rabbit Hole - Part III: Patching the Whitelist"
tags: re
date: 2019.03.28
---

Picking up where I've left off, I will take a look at where the string is referenced.

## fcn.000109fc (printError)

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/printError-1.png" width=100 %}

This function starts with calling a protocol which is referenced in ```SystemErrorLogDxe.efi```, if the return value is not less than 0 (which I'm assuming means an error hasn't occured) the rest of the blocks are executed.

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/printError-2.png" width=100 %}

The offset that points to the error string (which is at ```0x10258```) is used in the last block to craft the error message.

I have no idea what rbx holds, but depending on the value in its offset, the hex format thats added at the end of our error string changes. When the whole string is crafted in the buffer, it's used as an argument in the next function call, which again I wasn't able to resolve. But this whole function looks like it's an error logging function.

This function has xrefs in ```fcn.00010b10```.

## fcn.00010b10 (checkID)

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/pciCheck0.png" width=100 %}

Up until this point, I didn't think of asking the most important question: **What does the application check to enforce the whitelist?** The answer is simple: Subsystem Device IDs. 

### Device ID table

The program has a hardcoded table of IDs sitting at offset ```0x10270```:

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/idtable.png" width=100 %}

Each entry consists of the following:

```c
struct TableEntry {
    uint32_t category;      // Type of device
    uint16_t vendorID;      // Vendor ID
    uint16_t deviceID;      // Device ID
    uint32_t subsystemID;   // Subsystem Device ID
    uint32_t unknown;       // ???
}
```

When I checked the ID of my card with ```lspci -nn```:

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/wificard.png" width=100 %}

I had to go deeper with ```lspci -x``` to find the subsystem ID:

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/wificard2.png" width=100 %}

Meaning that:

```
Vendor ID:      8086        (Intel)
Device ID:      0085        (Centrino Advanced-N 6205 [Taylor Peak])
Subsystem ID:   8086:1311   (Centrino Advanced-N 6205 (802.11a/b/g/n))
```

My device's entry is at the offset ```0x102b0```.

I tried to identify the rest of the IDs using [this website](https://pci-ids.ucw.cz/) and with some googling:

```
Vendor ID   Subs. ID    Vendor      Subsystem
---------------------------------------------------------------------------------------
8086:0089   8086:1311   Intel       Centrino Advanced-N + WiMAX 6250 2x2 AGN
8086:0187               Intel       Centrino Advanced-N + WiMAX 6250 AGN (USB)
8086:4238   8086:1111   Intel       Centrino Ultimate-N 6300 3x3 AGN
8086:4238   8086:1118   Intel       Centrino Ultimate-N 6300 3x3 AGN Variant
8086:0085   8086:1311   Intel       Centrino Advanced-N 6205 (802.11a/b/g/n)
8086:0085   8086:1318   Intel       Centrino Advanced-N 6205 (802.11a/b/g/n) Variant    
10ec:8176   10ec:9581   Realtek     RTL8188CE 802.11b/g/n WiFi Adapter
8086:0891   8086:4222   Intel       Centrino Wireless-N 2200 BGN
14e4:4358   14e4:0543   Broadcom    BCM43227 802.11b/g/n
168c:002b   17aa:30a1   Qualcomm    Atheros AR9285 Wireless Network Adapter
1795:0720               OKB SAPR    ???
1795:0715               OKB SAPR    ???
1795:0022               OKB SAPR    ???
10ee:2012   10ee:0009   Xilinx      ???
10ee:2013   10ee:0009   Xilinx      ???
8086:088f   8086:4260   Intel       Centrino Advanced-N 6235 AGN
---------------------------------[USB Devices]-----------------------------------------
1199:9012               Sierra      Wireless Gobi 3000 Modem device (MC8355) Variant
1199:9013               Sierra      Wireless Gobi 3000 Modem device (MC8355)
0bdb:1927               Ericsson    H5321 gw HIDf
0bdb:1926               Ericsson    H5321 gw Mobile Broadband Network Adapter
114f:68a2               Wavecom     (Probably USB Modem)
0f3d:68a2               Airprime    (Probably USB Modem)
1199:68a2               Sierra      Wireless Gobi 3000 Modem device (MC7304)
```

The table also holds USB device IDs. This makes sense because the protocol interface was also referenced in ```LenovoWmaUsbDxe.efi```.

Back to fcn.00010b10. Depending on the second argument (held in rdx) one of two block sets is executed. The argument is checked againts the following values: ```0, 1, 5```, which are familiar as they are the three possible values of the first value in each table entry (there's also ```6``` but it's used as the terminating value to mark the end of the table). One block is for values ```1, 5``` and the other block executes for the value ```0```. This is consistent with the ID table because entries with values ```1, 5``` are USB devices while the entries with ```0``` are PCI devices. I will skip the block for USB devices for obvious reasons.

### PCI ID check block (aka where the whitelist is enforced)

The block starts with checking for the terminating entry:

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/pciCheck1.png" width=100 %}

Then the current entry is compared with the ID that was given as an argument to the function:

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/pciCheck2.png" width=100 %}

If the comparison fails, the next entry is checked if it's the end of the table (```0x10caa```). If it is, the printError function is called (jump to ```0x10bcd```). If there are still entries left, the flow goes back to ```0x10c7b``` for the check on the next entry.

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/pciCheck3.png" width=100 %}

If the entry is identical with the ID, The last value in the entry is checked (```0x10cc5```). If it's ```1``` then ```unknownProtocolHandle2``` is called. After looking through the references I found that it's installed in the ```MiscGaIoDxe.efi``` application, which uses the protocol from ```CpuIo.efi```. The names themselves don't reveal much, so I still don't know what this block does.


> After some research on the entries, especially on the Intel cards, I found a feature that correlates with the values at the end of these entries. All the cards that is ```1``` features Intel vPro. One Intel card that does not have vPro also has a ```0``` value. I will assume that this is the case (Because of time constraints, I couldn't go deeper to find out what this protocol actually does. I will have to continue with this assumption). Since I do not want anything to do with vPro, I will not use this block in my modified flow.

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/pciCheck4.png" width=100 %}

After setting ```sil``` accordingly, ```LenovoScratchData``` variable of the card (that is unique to the guid) is read and the value that falls into ```var_44h``` is compared against ```sil```. If they're not equal, then the value is set and the data is written back.

Here's an interesting block:

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/pciCheck5.png" width=100 %}

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/pciCheck6.png" width=100 %}

The current ID is compared against the device ```Centrino Advanced-N 6235 AGN``` (which already exists in the table) and if it's a match, ```LenovoScratchData``` is written back with the value at ```var_4fh``` set, then ```ResetSystem()``` function is called from the ```RuntimeServices``` table. No idea what this is for either.

After all this hassle, a couple more redundant operations are executed and the function returns. This function is referenced three times in ```InterfaceFunction```, each for a different type of device. There's not much to see in that function that's relevant to my goal, so I'll skip it entirely.

# Getting rid of the whitelist

Now that I know mostly (okay maybe partially) how this thing works, I know that there are different solutions to my problem, some of which are:

- Remove the efi application entirely from the BIOS.
- Modify the ID table, add my card's ID
- Modify the code flow, let any device go by

The first option seems risky as I don't know how the other applications will behave when the ```LocateProtocol``` call fails. The second one seems the safest and the most convenient because there are many entries in the table that I will never use. However, I'm here to slay the whitelist and that's what I shall do.

## Modifying the program flow

What I want to do is let the whitelist take care of the cards that are already in the table and not go into the error function for the rest. To accomplish this, I will modify the block in which the last entry is checked. If a card is compared against all entries and there are no other entries, the error function will be called. This part happens in the block ```0x10caa```:

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/pciCheck7.png" width=100 %}

This jump goes to the ```printError``` function. I will change it to ```0x10de3``` so that there is no error and the program will continue like the card is authorized.

After this anticlimactic solution, it's time time to put this back into the image and flash it.

# Putting everything back together

To test if the modification works successfully, I used an Intel Wireless-N 135 card from my old laptop. I put the card in and tried to boot my machine. The result was expected (sorry for the potato quality):

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/photo-error.jpg" width=100 %}

Then I tore the machine down and connected the BIOS chip to the USB programmer:

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/photo-motherboard.jpg" width=100 %}

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/photo-usb.jpg" width=100 %}

I dumped the current BIOS and patched it using UEFIPatch tool. I've created a pattern to patch the image:

```
79E0EDD7-9D1D-4F41-AE1A-F896169E5216 10 P:0AFFFFFF:20010000 
```

I erased the chip and then wrote the modified image back using the programmer's software:

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/usbProgrammer.png" width=100 %}

After verifying the written image, I put everything back together and tried to boot the machine. The machine did boot! The wifi card was recognized and I was able to connect to my router. I could see the card in the ```lspci``` output:

{% include aligner.html images="/2019-03-28-down_the_rabbit_hole_pt3/lspci.png" width=100 %}

# But wait, there's more?

No, just kidding :). I accomplished what I've set out to do and learned a lot in the process. I hope I was able to pass it on. Now, off to other adventures. Thanks for reading.

# References

- [https://github.com/LongSoft/UEFITool](https://github.com/LongSoft/UEFITool)
- [https://www.rodsbooks.com/efi-programming/efi_services.html](https://www.rodsbooks.com/efi-programming/efi_services.html)
- [http://wiki.bios.io/doku.php?id=start](http://wiki.bios.io/doku.php?id=start)
- [https://kazlauskas.me/entries/x64-uefi-os-1.html](https://kazlauskas.me/entries/x64-uefi-os-1.html)
- [https://dox.ipxe.org/UefiSpec_8h.html#ad2d1329cf6aa185e5918daaf335c3bf7](https://dox.ipxe.org/UefiSpec_8h.html#ad2d1329cf6aa185e5918daaf335c3bf7)
- [https://github.com/snare/ida-efiutils/blob/master/structs.idc](https://github.com/snare/ida-efiutils/blob/master/structs.idc)
- [https://habr.com/ru/post/249655/](https://habr.com/ru/post/249655/)
- [http://mjg59.dreamwidth.org/18773.html](http://mjg59.dreamwidth.org/18773.html)
- [http://x86asm.net/articles/uefi-programming-first-steps/](http://x86asm.net/articles/uefi-programming-first-steps/)
- [https://pci-ids.ucw.cz/read/PC/8086](https://pci-ids.ucw.cz/read/PC/8086)
- [https://cs.dartmouth.edu/~bx/blog/resources/uefi.html](https://cs.dartmouth.edu/~bx/blog/resources/uefi.html)
- [https://github.com/boseji/CH341-Store](https://github.com/boseji/CH341-Store)
- [https://github.com/bibanon/Coreboot-ThinkPads/wiki/xx30-BIOS-Whitelist-Removal](https://github.com/bibanon/Coreboot-ThinkPads/wiki/xx30-BIOS-Whitelist-Removal)

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@ihavelotsofspac" />
<meta name="twitter:title" content="Down the Rabbit Hole - Part III: Patching the Whitelist" />
<meta name="twitter:image" content="https://erfur.github.io/2019-03-28-down_the_rabbit_hole_pt3/pciCheck3.png" />