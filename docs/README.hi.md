<div align="center">

<img src="../assets/banner.png" alt="Isenax - आइसोमेट्रिक डायग्राम टूल" width="100%" />

</div>

<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## नोट:

यह रिपॉजिटरी (Isenax) [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW) से व्युत्पन्न है, जो स्वयं stan-smith/FossFLOW का फोर्क है (जो बदले में [markmanx/isoflow](https://github.com/markmanx/isoflow) का फोर्क था), मूल रूप से PR के माध्यम से मूल रिपॉजिटरी में योगदान देने के उद्देश्य से बनाया गया था। हालांकि लेखक का GitHub उपयोगकर्ता नाम बदलकर [mug-book-droid](https://github.com/mug-book-droid) हो गया प्रतीत होता है और उनकी गतिविधि निजी कर दी गई है (शायद खाता निलंबित है?), जिससे मूल रिपॉजिटरी अप्राप्य हो गई है।

फिलहाल, मेरा इरादा इस रिपॉजिटरी (अब Isenax नाम से) को FossFLOW के विकास की निरंतरता बनाना है, और PR के माध्यम से किसी भी योगदान का स्वागत है।

मूल रिपॉजिटरी की अंतिम स्थिति `backup/stan-smith-FossFLOW` ब्रांच पर देखी जा सकती है।

---

Isenax सुंदर आइसोमेट्रिक डायग्राम बनाने के लिए एक शक्तिशाली, ओपन-सोर्स प्रोग्रेसिव वेब ऐप (PWA) है। यह React और <a href="https://github.com/markmanx/isoflow">Isoflow</a> लाइब्रेरी (फोर्क करके npm पर fossflow के रूप में, और इस फोर्क में isenax के रूप में प्रकाशित) के साथ बनाया गया है, और पूरी तरह से आपके ब्राउज़र में ऑफ़लाइन समर्थन के साथ चलता है।

---
<p align="center">
<b>ऑनलाइन आज़माएं --> https://nyangko.github.io/Isenax/ <-- </b>
</p>

<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 Docker के साथ त्वरित डिप्लॉय

```bash
# Docker Compose का उपयोग करना (अनुशंसित - स्थायी स्टोरेज शामिल)
docker compose up

# या स्थायी स्टोरेज के साथ Docker Hub से सीधे चलाएं
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

Docker में सर्वर स्टोरेज डिफ़ॉल्ट रूप से सक्षम है। आपके डायग्राम होस्ट पर (डिफ़ॉल्ट रूप से root के रूप में) `./diagrams` में सहेजे जाएंगे। सहेजते समय उपयोगकर्ता या ग्रुप ID बदलने के लिए `PUID` और `PGID` एनवायरनमेंट वेरिएबल सेट करें।

सर्वर स्टोरेज अक्षम करने के लिए, `ENABLE_SERVER_STORAGE=false` सेट करें:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### HTTP बेसिक ऑथेंटिकेशन (वैकल्पिक)

अपने Isenax इंस्टेंस को HTTP Basic Auth से सुरक्षित करें:

```bash
# Docker Compose के साथ
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# या docker run के साथ
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **नोट**: प्रमाणीकरण सक्षम करने के लिए दोनों वेरिएबल सेट होने चाहिए। यदि इनमें से कोई भी खाली है, तो ऐप बिना लॉगिन के एक्सेस किया जा सकता है।

## त्वरित प्रारंभ (स्थानीय विकास)

```bash
# रिपॉजिटरी क्लोन करें
git clone https://github.com/nyangko/Isenax
cd Isenax

# निर्भरताएं इंस्टॉल करें
npm install

# लाइब्रेरी बनाएं (पहली बार आवश्यक)
npm run build:lib

# विकास सर्वर प्रारंभ करें
npm run dev
```

अपने ब्राउज़र में [http://localhost:3000](http://localhost:3000) खोलें।

## Monorepo संरचना

यह चार पैकेज वाला एक monorepo है:

- `packages/isenax-lib` - नेटवर्क डायग्राम बनाने के लिए React कंपोनेंट लाइब्रेरी (Rslib/Rspack के साथ निर्मित)
- `packages/isenax-app` - लाइब्रेरी को रैप करके प्रस्तुत करने वाला Progressive Web App (RSBuild के साथ निर्मित)
- `packages/isenax-backend` - डायग्राम के लिए वैकल्पिक सेल्फ-होस्टेड स्टोरेज प्रदान करने वाला Express सर्वर (Docker डिप्लॉयमेंट में उपयोग किया जाता है)
- `packages/isenax-mcp` - MCP (Model Context Protocol) सर्वर जो किसी बाहरी AI एजेंट को आपके डायग्राम सीधे पढ़ने, बनाने और संपादित करने देता है (stdio या Streamable HTTP)

### विकास कमांड

```bash
# विकास
npm run dev          # ऐप डेवलपमेंट सर्वर शुरू करें
npm run dev:lib      # लाइब्रेरी के लिए वॉच मोड

# बिल्डिंग
npm run build        # लाइब्रेरी और ऐप दोनों बनाएं
npm run build:lib    # केवल लाइब्रेरी बनाएं
npm run build:app    # केवल ऐप बनाएं

# टेस्टिंग और लिंटिंग
npm test             # यूनिट टेस्ट चलाएं
npm run lint         # लिंटिंग एरर जांचें

# E2E टेस्ट (Selenium)
cd e2e-tests
./run-tests.sh       # एंड-टू-एंड टेस्ट चलाएं (Docker और Python आवश्यक)

# प्रकाशन
npm run publish:lib  # लाइब्रेरी को npm पर प्रकाशित करें
```

## उपयोग कैसे करें

### डायग्राम बनाना

1. **आइटम जोड़ें**:
   - शीर्ष दाईं ओर मेनू पर "+" बटन दबाएं, कंपोनेंट लाइब्रेरी बाईं ओर दिखाई देगी
   - लाइब्रेरी से कंपोनेंट्स को कैनवास पर ड्रैग और ड्रॉप करें
   - या ग्रिड पर राइट-क्लिक करें और "Add node" चुनें

2. **आइटम कनेक्ट करें**:
   - कनेक्टर टूल चुनें ('C' दबाएं या कनेक्टर आइकन पर क्लिक करें)
   - **क्लिक मोड** (डिफ़ॉल्ट): पहले नोड पर क्लिक करें, फिर दूसरे नोड पर क्लिक करें
   - **ड्रैग मोड** (वैकल्पिक): पहले से दूसरे नोड तक क्लिक करके ड्रैग करें
   - सेटिंग्स → कनेक्टर टैब में मोड स्विच करें

3. **अपना काम सहेजें**:
   - **त्वरित सहेजें** - ब्राउज़र सेशन में सहेजता है
   - **एक्सपोर्ट** - JSON फ़ाइल के रूप में डाउनलोड करें
   - **इम्पोर्ट** - JSON फ़ाइल से लोड करें

4. **लेयर पैनल से व्यवस्थित करें**:
   - टूलबार से लेयर पैनल खोलें और कैनवास के सभी नोड, कनेक्टर, क्षेत्र और टेक्स्ट बॉक्स एक ही सूची में देखें
   - सूची में कोई आइटम चुनें और उसी पैनल के "संपादित करें" टैब में उसे तुरंत बदलें
   - छोटी स्क्रीन पर यह कैनवास के नीचे-दाएँ बटन से बॉटम शीट के रूप में खुलता है

### स्टोरेज विकल्प

- **सेशन स्टोरेज**: ब्राउज़र बंद होने पर अस्थायी सेव साफ़ हो जाते हैं
- **एक्सपोर्ट/इम्पोर्ट**: JSON फ़ाइलों के रूप में स्थायी स्टोरेज
- **ऑटो-सेव**: सेशन में हर 5 सेकंड में बदलाव स्वचालित रूप से सहेजता है

### MCP एकीकरण (AI एजेंट)

Isenax एक MCP सर्वर के साथ आता है ताकि कोई बाहरी AI एजेंट (Claude आदि) आपके डायग्राम सीधे पढ़, बना और संपादित कर सके:

1. **सेटिंग्स → MCP** खोलें और इसे चालू करें — एक कनेक्शन URL और Bearer टोकन दिखाई देगा।
2. अपने MCP क्लाइंट को उस URL/टोकन से कनेक्ट करें (`packages/isenax-mcp` stdio और Streamable HTTP दोनों ट्रांसपोर्ट सपोर्ट करता है)।
3. एजेंट द्वारा किए गए बदलाव उस डायग्राम को दिखा रहे किसी भी खुले टैब में तुरंत दिखते हैं, रीफ्रेश की ज़रूरत नहीं — काम के दौरान "MCP लिख रहा है..." संकेतक दिखता है।

बिल्ट-इन आइकॉन केवल id से आते-जाते हैं (एजेंट को base64 डेटा नहीं भेजा जाता), और `update_diagram_patch` टूल एजेंट को पूरा मॉडल फिर से भेजने के बजाय सिर्फ बदले हुए फ़ील्ड भेजने देता है।

## हाल में जोड़ी गई सुविधाएं

### कनेक्टर मल्टीप्लेक्सिंग
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### आइटम कॉपी-पेस्ट करना
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />

## योगदान देना

हम योगदान का स्वागत करते हैं! कृपया दिशानिर्देशों के लिए [CONTRIBUTING.md](../CONTRIBUTING.md) देखें।

## प्रलेखन

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - कोडबेस के लिए व्यापक गाइड
- [CONTRIBUTING.md](../CONTRIBUTING.md) - योगदान दिशानिर्देश

## लाइसेंस

MIT
