---
layout: post
title: Disk Encryption on Arch
tags: linux
---

I've been using linux on my computers since highschool. Though only in the recent
years I made a resolution to up my security game and implement some sort of disk
encryption. The arch wiki is famous for providing massive amount of knowledge
but that sometimes also means getting overwhelmed in the way. And thats exactly
what happened to me in my last try; I had to jump between pages for days until I
was finally able to finalize how I wanted to shape my partitioning and
encryption.

Previously I had left my boot partition unencrypted. This is not a serious issue
at first glance. Though it's still a good idea to keep it encrypted as it houses
the initramfs and the boot parameters, with which it is really trivial for a
capable attacker to set you up with a backdoored system [[1]][[2]].

[1]: https://en.wikipedia.org/wiki/Evil_maid_attack
[2]: https://www.schneier.com/blog/archives/2009/10/evil_maid_attac.html

The reason for this post is to explore some of the possible ways of how to set
up a (nearly) full-disk encryption. This includes the boot partition, the root,
the home and the swap. Currently there is no support for an encrypted EFI
partition so that has to be left unencrypted unfortunately.

## How to go about encrypting the whole disk

There are a number of facts that will determine how to set up the partitioning
and the encryption:

- The most recent GRUB version does not support the latest default
  dm-crypt mode that is LUKS2-Argon2 [[3]].
- Encrypted boot partition (if kept in a seperate luks partition) will require a
  second unlock with password entry to get mounted after boot.
- Boot doesn't have to be set up as a partition, instead can be created as a
  folder in the root partition. Though that in itself causes an interesting
  conundrum which I will explain later.
- Swap also does not have to be a partition. Having swap as a file does not cause
  any issues when used for hibernation.
- Argon2 is more resistant to cryptographic attacks than PBKDF2 [[4]].

Let's go through some of the scenarios that I considered.

[3]: https://wiki.archlinux.org/title/GRUB#LUKS2
[4]: https://crypto.stackexchange.com/a/30786

## Keep a seperate boot partition on LVM with LUKS1

{% include aligner.html images="/encrypted-arch/scenario1.png" width=100 %}

The latest grub `2:2.06.r261.g2f4430cc0-1` (as of writing this post) on arch
repositories does not support:

- Handling partitions encrypted using Argon2 algorithm.
- Generating a grub efistub that can handle LUKS2 partitions with `grub-install`.

With these in mind, if you want to stick with the main repository and not deal
with any custom parameters or hacks, it is possible to encrypt the boot
partition using LUKS1 mode:

```
cryptsetup luksFormat --type luks1 --pbkdf-force-iterations=500000 /dev/nvme0n1p2
```

The default iteration count for pbkdf2 algorithm (which is the default algorithm
when luks1 is used) will be too high because of the fact that the iteration
count. Since the benchmark is (probably) done with the full resources of the
computer and grub environment will be constrained in terms of resources (cpu and
memory capabilities), the time to unlock will be far from optimal. Hence it is
advised to use a lower iteration count to be able to unlock the disk on boot
within a reasonable timeframe. Though this is an obvious tradeoff, compromising
security for convenience.

Apart from having to explicitly use two parameters in cryptsetup calls, the rest
of the procedure goes on without a detour. Here's how I did it:

```bash
# create physical partitions
# nvme0n1p1: efi
# nvme0n1p2: boot
# nvme0n1p3: root
echo -e "size=512M, type=U\n size=512M, type=L\n size=+, type=L\n" | sfdisk /dev/nvme0n1

# format the efi partition
mkfs.fat -F 32 /dev/nvme0n1p1

# format the boot partition
cryptsetup luksFormat --type luks1 --pbkdf-force-iterations=500000 /dev/nvme0n1p2
cryptsetup open /dev/nvme0n1p2 boot
# keep the partition directly on top of LUKS
mkfs.ext4 /dev/mapper/boot

# format the root partition
cryptsetup luksFormat /dev/nvme0n1p2
cryptsetup open /dev/nvme0n1p2 netwalkerfs
# create the logical root partition
pvcreate /dev/mapper/netwalkerfs
vgcreate netwalkerfs /dev/mapper/netwalkerfs
lvcreate -l 100%FREE netwalkerfs -n root
mkfs.ext4 /dev/netwalkerfs/root

# mount them all
mount /dev/netwalkerfs/root /mnt
mkdir -p /mnt/boot
mount /dev/mapper/boot /mnt/boot
mkdir -p /mnt/boot/efi
mount /dev/nvme0n1p1 /mnt/boot/efi

# ready to proceed
# dont forget to set up:
#   mkinitcpio hooks
#   grub cryptodisk support
#   grub cryptodisk parameter 
```

## Keep a seperate boot partition on LVM but with LUKS2

{% include aligner.html images="/encrypted-arch/scenario2.png" width=100 %}

Formatting the encryption partition with LUKS2 does not require anything extra,
meaning that **the previous code with only the `luksFormat` line modified will
work just fine**:

```bash
cryptsetup luksFormat /dev/nvme0n1p2
```

Unfortunately LUKS2 mode also suffers from the previously mentioned boot time
issue where it will take a long time to unlock the partition on boot with the
default parameters. Still, since Argon2 is a stronger algorithm, decreasing the
iteration time (which is used to run a benchmark to set the iteration count to
match the given time) will still result in a better protected filesystem than
LUKS1.

```bash
# decrease iteration time but increase the key size
cryptsetup luksFormat --iter-time 200 --key-size 512 /dev/nvme0n1p2
```

Another issue is that, to be able to boot from the encrypted partition a patched
version of grub that supports Argon2 is required, though fortunately it's
already packaged and ready to be installed in AUR [[5]]. Still, note that the package
has other AUR dependencies so I advise installing an AUR helper first then
installing the package through the helper. I'm using paru and paru does not
install aur packages as root, so I create my user first then use paru with sudo:

[5]: https://aur.archlinux.org/packages/grub-improved-luks2-git

```bash
useradd -m -G wheel -s /bin/bash erfur || info "already exists."
echo "erfur ALL=(ALL:ALL) ALL" >> /etc/sudoers
passwd erfur

cd /tmp
pacman -S --noconfirm git
sudo -u erfur git clone https://aur.archlinux.org/paru-bin.git || info "folder exists."
cd /tmp/paru-bin
sudo -u erfur makepkg -si

sudo -u erfur paru -S --noconfirm grub-improved-luks2-git efibootmgr lvm2
```

After this the installation continues as usual.

## Keep boot as a folder in root partition

The previous scenarios work reasonably well but there is nothing gained (at
least none in my case) in keeping boot as a partition when it sits on the same
LUKS partition as root. The patched version of grub can access /boot just the
same. This approach simplifies the partition layout:

{% include aligner.html images="/encrypted-arch/scenario3.png" width=100 %}

Without having to create a boot partition, we are left with a shorter code:

```bash
# create physical partitions
# nvme0n1p1: efi
# nvme0n1p2: root
echo -e "size=512M, type=U\n size=+, type=L\n" | sfdisk /dev/nvme0n1

# format the efi partition
mkfs.fat -F 32 /dev/nvme0n1p1

# format the root partition
cryptsetup luksFormat --iter-time 200 --key-size 512 /dev/nvme0n1p2
cryptsetup open /dev/nvme0n1p2 netwalkerfs
# create the logical root partition
pvcreate /dev/mapper/netwalkerfs
vgcreate netwalkerfs /dev/mapper/netwalkerfs
lvcreate -l 100%FREE netwalkerfs -n root
mkfs.ext4 /dev/netwalkerfs/root

# mount them all
mount /dev/netwalkerfs/root /mnt
mkdir -p /mnt/boot/efi
mount /dev/nvme0n1p1 /mnt/boot/efi

# ready to proceed
# dont forget to set up:
#   mkinitcpio hooks
#   grub cryptodisk support
#   grub cryptodisk parameter 
```

## How not to compromise the security of root without compromising the convenience on boot

It is possible not to let the two affect each other by having boot and root
on seperate luks partitions. The root partition can be created with default
parameters while the boot partition can be created with a lower iteration time
which will still be reasonably effective and not unbearably slow.

{% include aligner.html images="/encrypted-arch/scenario4.png" width=100 %}

Since boot is a single partition on luks, there is no need to add an lvm layer
there. The same can also be said for the root partition in this specific case
but I added lvm just in case.

Here's the code to achieve this scheme:

```bash
# create physical partitions
# nvme0n1p1: efi
# nvme0n1p1: boot
# nvme0n1p2: root
echo -e "size=512M, type=U\n size=512M, type=L\n size=+, type=L\n" | sfdisk /dev/nvme0n1

# format the efi partition
mkfs.fat -F 32 /dev/nvme0n1p1

# format the boot partition
cryptsetup luksFormat --iter-time 200 --key-size 512 /dev/nvme0n1p2
cryptsetup open /dev/nvme0n1p2 netwalkerfs
# create the logical root partition
pvcreate /dev/mapper/netwalkerfs
vgcreate netwalkerfs /dev/mapper/netwalkerfs
lvcreate -l 100%FREE netwalkerfs -n root
mkfs.ext4 /dev/netwalkerfs/root

# format the root partition
cryptsetup luksFormat --iter-time 200 --key-size 512 /dev/nvme0n1p2
cryptsetup open /dev/nvme0n1p2 netwalkerfs
# create the logical root partition
pvcreate /dev/mapper/netwalkerfs
vgcreate netwalkerfs /dev/mapper/netwalkerfs
lvcreate -l 100%FREE netwalkerfs -n root
mkfs.ext4 /dev/netwalkerfs/root

# mount them all
mount /dev/netwalkerfs/root /mnt
mkdir -p /mnt/boot/efi
mount /dev/nvme0n1p1 /mnt/boot/efi

# ready to proceed
# dont forget to set up:
#   mkinitcpio hooks
#   grub cryptodisk support
#   grub cryptodisk parameter 
```

The caveat here is that since boot is in a seperate encrypted partition, it will
require a second unlock after unlocking the root partition if the boot partition
is configured to automount (added into /etc/crypttab), resulting in three
consecutive password prompts. This can be solved using keyfiles:

- The root partition can be automatically unlocked using a keyfile kept in the
  initramfs or the boot partition [[6]][[7]].
- The boot partition can be automatically mounted after boot using a keyfile
  kept in the root filesystem.

Applying both of these will reduce the number prompts to just one, on the other
hand the keys will be accessible while the partitions are mounted. It is a
significant tradeoff to consider.

[6]: https://wiki.archlinux.org/title/Dm-crypt/Device_encryption#Unlocking_the_root_partition_at_boot
[7]: https://wiki.archlinux.org/title/Dm-crypt/Device_encryption#Storing_the_keyfile_in_ramfs

## What about swap?

Since swap can be set up as a file in the root partition [[8]], I did not include it
until now. It takes a few steps to set up a swapfile and these steps can be
included in any of the previous scenarios:

[8]: https://wiki.archlinux.org/title/Power_management/Suspend_and_hibernate#Hibernation_into_swap_file

```bash
# create swapfile (40GiB in my case)
dd if=/dev/zero of=/swapfile bs=1G count=40 status=progress
# only root should have access
chmod 0600 /swapfile
# format for swap
mkswap -U clear /swapfile
swapon /swapfile
# add to fstab
echo "/swapfile none swap defaults 0 0" >> /etc/fstab

# add necessary parameters to the grub config
swap_offset=`filefrag -v /swapfile | awk '$1=="0:" {print substr($4, 1, length($4)-2)}'`
# resume should point to the logical partition
sed -i "s|^GRUB_CMDLINE_LINUX=.*|GRUB_CMDLINE_LINUX=\"resume=/dev/netwalkerfs/root resume_offset=$swap_offset\"|g" /etc/default/grub
```

## EFI partition

It is not quite possible to call it a full-disk encryption while the EFI
partition is unencrypted. Do not fret, as modern cryptography is here to
compensate. It is possible to roll grub with secure boot to ensure the integrity
of the efistub. Though I'm currently not using it, I'll surely implement it
someday.

This post has been written in a very short span of time, which is surprising to
me. I did not intend to paint a complete picture here, hence only partial codes
to achieve the specific partitioning schemes. I'm currently in the process of
converting my installation scripts to ansible playbooks, after that I might
release them.

