---
layout: post
title: "[EN] Facebook CTF 2019 writeups"
tags: re ctf
date: 2019.06.03
---

After a long time wasting away months of my life dealing with university, I was finally able to spend some quality time tackling some ctf challenges last weekend. Facebook CTF was fun and I hope to see it happening again next year. Here are the reverse challenges that we solved with my fellow team members.

## (re) imageprot

This one is a rust binary. It has three main functions:

```
[0x0004fc10]> afl~imageprot
0x000562f0  121 4718 -> 4699 sym.imageprot::main::h60a99eb3d3587835
0x00055f40   27 604          sym.imageprot::decrypt::h56022ac7eed95389
0x000561e0    6 208          sym.imageprot::get_uri::h3e649992b59ca680
```

- decrypt function first decodes the base64 string then XORs it with the key "1337". This is all of the obfuscation this program does.
- get_uri function does exactly what you would expect.

The program first creates a list names ("vagrant", "gdb" etc.) that are used to find if any "Hacking tools" are running on the system. Just before checking the running processes, it tries to get the url `http://challenges.fbctf.com/vault_is_intern` which is invalid and after timeout the program panicks and exits. We modified this url in the binary to `http://127.0.0.1/.fbctf.com/vault_is_intern` then ran an http server using ```python -m http.server 80```. It works because the program doesn't care or use what the GET request returns.

After the check, the program gets another url `https://httpbin.org/status/418` which is the HTTP response code of a teapot:

```

    -=[ teapot ]=-

       _...._
     .'  _ _ `.
    | ."` ^ `". _,
    \_;`"---"`|//
      |       ;/
      \_     _/
        `"""`
```

This response data is used as an XOR key to decrypt the last piece of the puzzle which in the end turns out to be a JPEG file that contains the flag.

Solver script:

```python
from pwn import *
import requests
from itertools import cycle
import base64

def getTeapot():
    return requests.get("https://httpbin.org/status/418").text

def xor(data, key):
    return "".join([chr(ord(a)^ord(b)) for a,b in zip(data, cycle(key))])

def getData():
    e = ELF("imageprot")
    data = e.read(e.address+0x002bf11a, 0x159c4)
    return base64.b64decode(data)

def solve():
    with open("flag.jpg", "wb") as f:
        f.write(xor(getData(), getTeapot()))

if __name__ == "__main__":
    solve()
```

output:

{% include aligner.html images="/2019-06-04-Facebook_CTF_2019_writeups/flag.jpg" width=100 %}

## (re) go_get_the_flag

This time it's a go binary. When it's run, the program asks for a password. Listing the function related to main:

```
[0x00452bc0]> afl~main
0x00429950   35 900          sym.go.runtime.main
0x0044e3b0    3 71           sym.go.runtime.main.func1
0x0044e400    5 60           sym.go.runtime.main.func2
0x004916b0    9 341          sym.go.main.main
0x00491810    9 537          sym.go.main.checkpassword
0x00491a30   32 1092         sym.go.main.decryptflag
0x00491e80    3 151          sym.go.main.wrongpass
0x00491f20    7 117          sym.go.main.init
```

First thing to check is the checkpassword function.

{% include aligner.html images="/2019-06-04-Facebook_CTF_2019_writeups/checkpassword.png" width=100 %}

r2 already gives the password away:

```
$ ./ggtf s0_M4NY_Func710n2!
fb{.60pcln74b_15_4w350m3}
```

## (re) SOMBRERO ROJO (pt1)

The file arrives in a corrupt state. The endianness is set to big-endian in the header. After fixing the header the real challenge begins.

This binary has some relatively serious anti-reverse techniques. Different functions are called depending on the ptrace output using indirect functions ([https://sourceware.org/glibc/wiki/GNU_IFUNC](https://sourceware.org/glibc/wiki/GNU_IFUNC), [https://willnewton.name/2013/07/02/using-gnu-indirect-functions/](https://willnewton.name/2013/07/02/using-gnu-indirect-functions/)). This makes it very hard to follow the program flow.

When first run, the program asks for arguments. Disassembling and debugging reveals that the argument is given to the function @0x400498 with another string `my_sUp3r_s3cret_p@$$w0rd1`. Trying to run the program with this string shows that this was a fake:

```
$ ./sombrero_rojo 'my_sUp3r_s3cret_p@$$w0rd1'
Nope{Lolz_this_isnt_the_flag...Try again...}
```

After getting rid of ptrace, strace output becomes more meaningful:

```
$ strace -e inject=ptrace:retval=0 -i ./sombrero_rojo 'my_sUp3r_s3cret_p@$$w0rd1'                  
[00007f390383fbdb] execve("./sombrero_rojo", ["./sombrero_rojo", "my_sUp3r_s3cret_p@$$w0rd1"], 0x7ffe49ab1350 /* 50 vars */) = 0
[000000000047a009] brk(NULL)            = 0x18bf000
[000000000047a009] brk(0x18c01c0)       = 0x18c01c0
[00000000004055f8] arch_prctl(ARCH_SET_FS, 0x18bf880) = 0
[0000000000479bf7] uname({sysname="Linux", nodename="n1ghtrid3r", ...}) = 0
[0000000000484184] readlink("/proc/self/exe", "/home/erfur/Downloads/facebookct"..., 4096) = 72
[000000000047a009] brk(0x18e11c0)       = 0x18e11c0
[000000000047a009] brk(0x18e2000)       = 0x18e2000
[0000000000481ece] access("/etc/ld.so.nohwcap", F_OK) = -1 ENOENT (No such file or directory)
[000000000044ecaf] ptrace(PTRACE_TRACEME) = 0 (INJECTED)
[000000000044e0f7] access("/tmp/key.bin", F_OK) = -1 ENOENT (No such file or directory)
[000000000044dcf3] fstat(1, {st_mode=S_IFCHR|0620, st_rdev=makedev(0x88, 0x4), ...}) = 0
[000000000044e001] write(1, "Nope{Lolz_this_isnt_the_flag...T"..., 45Nope{Lolz_this_isnt_the_flag...Try again...}) = 45
[000000000044d6d6] exit_group(0)        = ?
[????????????????] +++ exited with 0 +++
```

After ptrace, `/tmp/key.bin` is accessed. Looking around in the function of this call,

{% include aligner.html images="/2019-06-04-Facebook_CTF_2019_writeups/access.png" width=100 %}

we found out that the file should contain `"\xfb\x00\x95\x17\x90\xf4"`. After creating this file, the program prints the flag itself:

 ```
$ echo -n "\xfb\x00\x95\x17\x90\xf4" > /tmp/key.bin
$ ./sombrero_rojo 
fb{7h47_W4sn7_S0_H4Rd}
Ready for the next challenge?... press enter
```

After pressing enter, the program exits and we see a new file next to it called "next_challenge.bin". However, the file is corrupted. **Unfortunately we were unable to solve the second part** as we weren't able to understand the decryption scheme. According to [this](https://github.com/Jinmo/ctfs/blob/master/2019/fbctf/rev/sombrero_rojo.md#part-2) writeup, it was an RC4 decryption and the key address was off by one byte. After fixing this mistake, the second binary is decrypted successfully and we get the flag after running it:

```
$ ./next_challenge.bin

MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWX0OkkkkOKNWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWKOxlcclllccld0WMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMXdcccd0XXK0xlco0WMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMXdcclOWWWNNXklcoKWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMXdcclOWWWWNNXxccdXMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNdcclOWWWWNNNKdcckNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNxcccOWWWWWNNNOlcoKMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMXdccckWWWWWNNNKdcckWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWOlccoKWWWWNNNNXxccxNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNOlcco0WWWWNNNNNKdcckWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNklcox0WWWWNNNNNNOlcl0WMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMXxccdKNWWWWNNNNNNXkccdXMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWKdccxXWWWWWNNNNNNNKdcckNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMW0oclkNWWWWNNNNNNNNNOlclOXNNNNNNNNNNNNNNNNNNNWWMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNklcoONWWWWWNNNNNNNNXxccclooooooooooooooooooooodk0XWMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWKdccdKWWWWWWWWNNNNNNNXOxxxxxxxxxxxxxxxddddddddddoccoONMMMMMMM
MMMMMMMWXKKKKKKKKKKKKKKKKKKKKKKKKKKKXKklclkXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNXKOoclOWMMMMMM
MMMMMMXklcccccccccccccccccccccccccccllcld0WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNNXxccxNMMMMMM
MMMMMM0lcclllllllllllllllllllllllccclokKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNNXOlclOWMMMMMM
MMMMMMKoccodddddddddddddddddddddlcclOXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNKOdlclkXWMMMMMM
MMMMMMXoccodooooooooooooooooooddlccdKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNXOoccoONWMMMMMMM
MMMMMMXdccldooooooooooooooooooodlccoKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNNOl:oKMMMMMMMMM
MMMMMMNxccldooooooooooooooooooodlccoKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNNOlcoKMMMMMMMMM
MMMMMMWkccloooooooooooooooooooodlccoKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNXOoccxNMMMMMMMMM
MMMMMMWOlclodoooooooooooooooooodlccoKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNXkocclkXWMMMMMMMMM
MMMMMMM0lccodoooooooooooooooooodlccoKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNXklccxNWMMMMMMMMMM
MMMMMMMKoccodoooooooooooooooooodlccoKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNXxccxNMMMMMMMMMMM
MMMMMMMXdccodoooooooooooooooooodlccoKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNNN0oclkNMMMMMMMMMMM
MMMMMMMNxccldoooooooooooooooooodlccoKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNX0klclxXWMMMMMMMMMMM
MMMMMMMWkcclooooooooooooooooooodlccdKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNN0occlkXWMMMMMMMMMMMM
MMMMMMMWOlclooooooooooooooooooodlccoKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNXOlco0WMMMMMMMMMMMMM
MMMMMMMM0lclodooooooooooxO00koodlccoKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNN0ocl0WMMMMMMMMMMMMM
MMMMMMMMKoccodooooooooooONNNKxodlcclxO0KNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNNNNNNNNX0dccxXMMMMMMMMMMMMMM
MMMMMMMMXdccodooooooooooxO00koodlcccccclok0KXXXXXXXXXXXXXXXXXXXXXXXXXKKKKKKK00kdlclxKWMMMMMMMMMMMMMM
MMMMMMMMNxccldooooooooooooooooodlcccccodoccllllllllllllllllllllllllllllllllllcclox0NWMMMMMMMMMMMMMMM
MMMMMMMMWkccclllllllllllllllllllccccclONXKOkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkOKXWWMMMMMMMMMMMMMMMMM
MMMMMMMMMN0xddddddddddddddddddddddddxONWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
fb{YOU GOT THE LAST FLAG!!! NICE WORK!!!}
```
