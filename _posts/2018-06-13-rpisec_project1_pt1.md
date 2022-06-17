---
layout: post
title: "Savaş Oyunları: Format İpliklerinin Dönüşü Part I"
category: pwn
date: 18.06.13
---

*Az sonra okuyacaklarınız tamamen hayal ürünüdür ve gerçek hayatta 
kullanılan hiçbir uygulama veya portla ilgisi yoktur.*

## Girizgah

Geçenlerde RPISEC'in hazırladığı "Modern Binary Exploitation" eğitimini 
taradım. Hazırlanan içerik derste kullanılan slaytlar ve ödev olarak 
verilen uygulamalardan oluşuyor. Sıfırdan başlayan birine önermesem de 
mutlaka gözden geçirilmesi gereken bir kaynak. Temelleri kavradıktan 
sonra verilen ödevleri çözmenizi şiddetle tavsiye ederim.

<https://github.com/RPISEC/MBE>

Ders materyalleri arasında öğretilen konuların beraber kullanılarak 
çözülmesi gereken iki proje var. Bunlardan ilki tw33tchainz adlı 
programı ele alıyor. Projede bizden programı analiz etmemiz, programda 
kullanılan zayıf mekanizmaları ortaya çıkarmamız ve en sonunda program 
üzerinden komut çalıştırmamız isteniyor. Bu materyallerin bir
üniversitede ders olarak okutulduğu düşüncesi beni mutlu ediyor (Diğer
yandan da kulüp açmak için bizimkilerin bana yaşattıkları aklıma geliyor).

Dersi hazırlayan güzide abilerimiz tüm sistemi bir disk imajına atıp
hazır bir halde bize sunmuşlar. Virtualbox'a ekleyip uğraşsız bir
şekilde sistemi başlattım. Sistemin IP'sini aldıktan sonra ssh üzerinden
proje 1 kullanıcısına giriş yaptım. (project1:project1start)

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/0login.png" %}

Programımız /levels/project1/ dizini altında, project1_priv
kullanıcısının sahipliğinde ve suid biti açık. Amaç programı
kullanarak /home/project1_priv/.pass dosyasından bayrağı okumak.

## Bindik bi alamete gidiyoz kıyamete

Programı açtığımda ilk olarak username sorgusuyla karşılaşıyorum.

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/1username.png" %}

Kullanıcı adı girdikten sonra program benden tuz istiyor. Yemek yapmaya
mı geldik? Pardon, program benden şifreleme için benden salt değeri
istiyormuş (Kendime not: açken daha eğlenceli şeylerle uğraş).

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/2salt.png" %}

Programı tuzladıktan sonra program bana bir parola üretiyor ve daha 
sonra beni ana menüye atıyor.

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/3mainmenu.png" %}

Basit bir ana menüyle karşılaşıyorum. 1 ile tw33t yazıp zincire ekliyor,
2 ile tw33t zincirimize bakabiliyor, 4 ile (3 nerede?) programın afişini
bastırabiliyor ve 5 ile programı sonlandırabiliyorum.

Programın benden istediği bilgiler ve bize sunduğu özellikleri
karşılaştırdığımda bir şeylerin eksik olduğunu hissediyorum. Belli ki
bazı özellikler direk kullanıma sunulmamış. Mesela menüde 3'ü seçtiğimde
program bana parola soruyor. 

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/4enterpass.png" %}

Bu parolanın nereden geldiği veya doğru girdiğimde neyle karşılaşacağım
belli değil.

## Asıl eğlence şimdi başlıyor

Masum kullanıcı rolümü buraya kadar oynuyor ve cebimden neşteri
çıkarıyorum. Artık görünenin altında ne yattığını öğrenmemin vakti
geldi. Imajda bize sunulan araçlardan birini açıyorum. radare2 beni her
zamanki fallarından biriyle karşılıyor.

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/5radare.png" %}

Analizden sonra (aaaa) ilk olarak program hakkında bilgi edinmek amaçlı
i, ii ve il komutlarını çalıştırıyorum. 

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/6i.png" %}

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/7bininfo.png" %}

32 bit bir ELF dosyası, kütüphane olarak libc kullanıyor ve günlük
kullandığımız fonksiyonları içe aktarıyor. Daha sonra programdaki tüm
fonksiyonları listeliyorum (afl).

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/9memset.png" %}

Aralarda ilginç fonksiyon isimleri ile karşılaşıyorum. Şöyle bir
listelersem:

 - sym.gen_pass
 - sym.hash
 - sym.gen_user
 - sym.maybe_admin

Bu fonksiyonların işleyişi programın arayüzüne yansımıyor. Bunları
incelersem doğru yönde sağlam bir adım atmış olurum gibi hissediyorum. 
Ancak önce main fonksiyonuna bir göz atıp programın genel işleyişi
hakkında biraz daha bilgi edinmek istiyorum. (s main) ve (VV)
komutlarından sonra karşıma main fonksiyonunun akış şeması çıkıyor.

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/8main.png" %}

### Ey main bize neyledin?

Main fonksiyonunun başında fonksiyonun argümanları kontrol ediliyor.
Eğer argc == 0 değilse argümanlar memset() fonksiyonu ile sıfırlanıyor.
Bu işlemden sonra akış bir dizi fonksiyonlar üzerinden devam ediyor.

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/10functions.png" %}

 - print_banner
 - gen_pass
 - gen_user
 - print_banner
 - print_menu
 - get_unum

Fonksiyonların isimlerinden ne yaptıkları az çok anlaşılıyor. Ana menüde
get_unum() fonksiyonuyla kullanıcıdan unsigned int alınıyor ve bu sayı
6'dan küçükse tekrar girdi isteniyor. Eğer girilen sayı 0 ile 6
arasındaysa 0x8049a24 adresindeki fonksiyon listesinden istenen
fonksiyona atlanıyor. 

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/11menufunctions.png" %}

Bu fonksiyonlar da sırasıyla:

 - 0 getchar
 - 1 do_tweet
 - 2 view_chainz
 - 3 maybe_admin
 - 4 print_banner
 - 5 print_exit
 - 6 ???

{% include aligner.html images="/assets/2018-06-13-rpisec_project1_pt1/12mysterioustructions.png" %}

Son sırada bulunan adreste bir takım işlemler yapılıyor. Bu işlemler
programda bulunan is_admin ve debug_mode isimli değişkenleri kullanıyor.
Demek ki programda gizli bir mod bulunuyor. Program admin olup
olmadığımızı kontrol ettikten sonra admin isek programın debug modunu
açıyor. İşler giderek ilginçleşiyor.

_Yazar bu yazısını tamamlayamadan ortadan kaybolmuş ve kendisinden haber
alınamamaktadır. Çok da umutlanmamak lazım..._
