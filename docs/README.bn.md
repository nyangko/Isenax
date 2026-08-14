<div align="center">

<img src="../assets/banner.png" alt="Isenax - আইসোমেট্রিক ডায়াগ্রাম টুল" width="100%" />

</div>

<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## নোট:

এই রিপোজিটরি (Isenax) হল [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW)-এর একটি ডেরিভেটিভ, যা নিজেই stan-smith/FossFLOW-এর একটি ফর্ক (যা আবার [markmanx/isoflow](https://github.com/markmanx/isoflow)-এর একটি ফর্ক ছিল), মূলত PR-এর মাধ্যমে মূল রিপোজিটরিতে অবদান রাখার উদ্দেশ্যে তৈরি করা হয়েছিল। তবে লেখকের GitHub ব্যবহারকারীর নাম পরিবর্তিত হয়ে [mug-book-droid](https://github.com/mug-book-droid) হয়েছে বলে মনে হচ্ছে এবং তার কার্যকলাপ ব্যক্তিগত করা হয়েছে (সম্ভবত অ্যাকাউন্ট স্থগিত?), যার ফলে মূল রিপোজিটরিতে প্রবেশ করা যাচ্ছে না।

আপাতত, আমার উদ্দেশ্য এই রিপোজিটরিকে (এখন Isenax নামে) FossFLOW-এর উন্নয়নের ধারাবাহিকতা করা, এবং PR-এর মাধ্যমে যেকোনো অবদানও স্বাগত।

মূল রিপোজিটরির শেষ অবস্থা যা আমি সংগ্রহ করেছি তা `backup/stan-smith-FossFLOW` ব্রাঞ্চে দেখা যাবে।

---

Isenax হল সুন্দর আইসোমেট্রিক ডায়াগ্রাম তৈরি করার জন্য একটি শক্তিশালী, ওপেন-সোর্স প্রগ্রেসিভ ওয়েব অ্যাপ (PWA)। React এবং <a href="https://github.com/markmanx/isoflow">Isoflow</a> লাইব্রেরি (ফর্ক করে npm-এ fossflow হিসেবে, এবং এই ফর্কে isenax হিসেবে প্রকাশিত) দিয়ে তৈরি, এটি সম্পূর্ণরূপে আপনার ব্রাউজারে অফলাইন সাপোর্ট সহ চলে।

---
<p align="center">
<b>অনলাইনে চেষ্টা করুন --> https://nyangko.github.io/Isenax/ <-- </b>
</p>

<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 Docker দিয়ে দ্রুত ডিপ্লয়

```bash
# Docker Compose ব্যবহার করা (প্রস্তাবিত - স্থায়ী স্টোরেজ অন্তর্ভুক্ত)
docker compose up

# অথবা স্থায়ী স্টোরেজ সহ Docker Hub থেকে সরাসরি চালান
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

Docker-এ সার্ভার স্টোরেজ ডিফল্টভাবে সক্রিয়। আপনার ডায়াগ্রামগুলি হোস্টে `./diagrams`-এ (ডিফল্টভাবে root হিসেবে) সংরক্ষিত হবে। সংরক্ষণের জন্য ব্যবহারকারী বা গ্রুপ ID পরিবর্তন করতে, `PUID` এবং `PGID` এনভায়রনমেন্ট ভেরিয়েবল সেট করুন।

সার্ভার স্টোরেজ নিষ্ক্রিয় করতে, `ENABLE_SERVER_STORAGE=false` সেট করুন:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### HTTP বেসিক অথেনটিকেশন (ঐচ্ছিক)

HTTP Basic Auth দিয়ে আপনার Isenax ইনস্ট্যান্স সুরক্ষিত করুন:

```bash
# Docker Compose সহ
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# অথবা docker run সহ
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **নোট**: প্রমাণীকরণ সক্রিয় করতে উভয় ভেরিয়েবল সেট করা আবশ্যক। এর মধ্যে যেকোনো একটি খালি থাকলে, অ্যাপটি লগইন ছাড়াই অ্যাক্সেসযোগ্য।

## দ্রুত শুরু (স্থানীয় উন্নয়ন)

```bash
# রিপোজিটরি ক্লোন করুন
git clone https://github.com/nyangko/Isenax
cd Isenax

# নির্ভরতা ইনস্টল করুন
npm install

# লাইব্রেরি তৈরি করুন (প্রথমবার প্রয়োজনীয়)
npm run build:lib

# উন্নয়ন সার্ভার শুরু করুন
npm run dev
```

আপনার ব্রাউজারে [http://localhost:3000](http://localhost:3000) খুলুন।

## Monorepo কাঠামো

এটি চারটি প্যাকেজ সম্বলিত একটি monorepo:

- `packages/isenax-lib` - নেটওয়ার্ক ডায়াগ্রাম আঁকার জন্য React কম্পোনেন্ট লাইব্রেরি (Rslib/Rspack দিয়ে তৈরি)
- `packages/isenax-app` - লাইব্রেরিকে র‍্যাপ করে উপস্থাপনকারী Progressive Web App (RSBuild দিয়ে তৈরি)
- `packages/isenax-backend` - ডায়াগ্রামের জন্য ঐচ্ছিক সেলফ-হোস্টেড স্টোরেজ প্রদানকারী Express সার্ভার (Docker ডিপ্লয়মেন্টে ব্যবহৃত)
- `packages/isenax-mcp` - MCP (Model Context Protocol) সার্ভার যা একটি বহিরাগত AI এজেন্টকে আপনার ডায়াগ্রাম সরাসরি পড়তে, তৈরি করতে এবং সম্পাদনা করতে দেয় (stdio বা Streamable HTTP)

### উন্নয়ন কমান্ড

```bash
# উন্নয়ন
npm run dev          # অ্যাপ উন্নয়ন সার্ভার শুরু করুন
npm run dev:lib      # লাইব্রেরি উন্নয়নের জন্য ওয়াচ মোড

# বিল্ডিং
npm run build        # লাইব্রেরি এবং অ্যাপ উভয়ই তৈরি করুন
npm run build:lib    # শুধুমাত্র লাইব্রেরি তৈরি করুন
npm run build:app    # শুধুমাত্র অ্যাপ তৈরি করুন

# পরীক্ষা এবং লিন্টিং
npm test             # ইউনিট টেস্ট চালান
npm run lint         # লিন্টিং ত্রুটি পরীক্ষা করুন

# E2E টেস্ট (Selenium)
cd e2e-tests
./run-tests.sh       # এন্ড-টু-এন্ড টেস্ট চালান (Docker এবং Python প্রয়োজন)

# প্রকাশনা
npm run publish:lib  # npm-এ লাইব্রেরি প্রকাশ করুন
```

## কীভাবে ব্যবহার করবেন

### ডায়াগ্রাম তৈরি করা

1. **আইটেম যোগ করুন**:
   - উপরের ডানদিকের মেনুতে "+" বোতাম টিপুন, কম্পোনেন্ট লাইব্রেরি বাম দিকে প্রদর্শিত হবে
   - লাইব্রেরি থেকে ক্যানভাসে কম্পোনেন্ট ড্র্যাগ এবং ড্রপ করুন
   - অথবা গ্রিডে রাইট-ক্লিক করুন এবং "নোড যোগ করুন" নির্বাচন করুন

2. **আইটেম সংযুক্ত করুন**:
   - সংযোজক টুল নির্বাচন করুন ('C' টিপুন বা সংযোজক আইকনে ক্লিক করুন)
   - **ক্লিক মোড** (ডিফল্ট): প্রথম নোডে ক্লিক করুন, তারপর দ্বিতীয় নোডে ক্লিক করুন
   - **ড্র্যাগ মোড** (ঐচ্ছিক): প্রথম নোড থেকে দ্বিতীয় নোডে ক্লিক করুন এবং ড্র্যাগ করুন
   - সেটিংস → সংযোজক ট্যাবে মোড স্যুইচ করুন

3. **আপনার কাজ সংরক্ষণ করুন**:
   - **দ্রুত সংরক্ষণ** - ব্রাউজার সেশনে সংরক্ষণ করে
   - **রপ্তানি** - JSON ফাইল হিসাবে ডাউনলোড করুন
   - **আমদানি** - JSON ফাইল থেকে লোড করুন

4. **লেয়ার প্যানেল দিয়ে গুছিয়ে নিন**:
   - টুলবার থেকে লেয়ার প্যানেল খুলুন — ক্যানভাসের সব নোড, কানেক্টর, এরিয়া ও টেক্সট বক্স এক তালিকায় দেখা যাবে
   - তালিকা থেকে কোনো আইটেম বেছে নিলে একই প্যানেলের "সম্পাদনা" ট্যাবে সেটি সরাসরি সম্পাদনা করা যায়
   - ছোট স্ক্রিনে এটি ক্যানভাসের নিচে-ডানদিকের বোতাম থেকে বটম শিট হিসেবে খোলে

### স্টোরেজ বিকল্প

- **সেশন স্টোরেজ**: ব্রাউজার বন্ধ হলে অস্থায়ী সংরক্ষণগুলি মুছে যায়
- **রপ্তানি/আমদানি**: JSON ফাইল হিসাবে স্থায়ী স্টোরেজ
- **অটো-সেভ**: সেশনে প্রতি 5 সেকেন্ডে পরিবর্তনগুলি স্বয়ংক্রিয়ভাবে সংরক্ষণ করে

### MCP ইন্টিগ্রেশন (AI এজেন্ট)

Isenax একটি MCP সার্ভার সহ আসে যাতে একটি বহিরাগত AI এজেন্ট (Claude ইত্যাদি) আপনার ডায়াগ্রাম সরাসরি পড়তে, তৈরি করতে এবং সম্পাদনা করতে পারে:

1. **সেটিংস → MCP** খুলে চালু করুন — একটি সংযোগ URL এবং Bearer টোকেন দেখানো হবে।
2. আপনার MCP ক্লায়েন্টকে সেই URL/টোকেন দিয়ে সংযুক্ত করুন (`packages/isenax-mcp` stdio এবং Streamable HTTP উভয় ট্রান্সপোর্ট সমর্থন করে)।
3. এজেন্টের করা পরিবর্তনগুলো সেই ডায়াগ্রাম দেখানো যেকোনো খোলা ট্যাবে সাথে সাথে প্রতিফলিত হয়, রিফ্রেশের দরকার নেই — কাজ চলাকালীন "MCP লিখছে..." নির্দেশক দেখানো হয়।

বিল্ট-ইন আইকনগুলো শুধু id দিয়ে যাতায়াত করে (এজেন্টকে base64 ডেটা পাঠানো হয় না), এবং `update_diagram_patch` টুল এজেন্টকে পুরো মডেল আবার না পাঠিয়ে শুধু পরিবর্তিত ফিল্ডগুলো পাঠাতে দেয়।

## সম্প্রতি যুক্ত হয়েছে

### সংযোজক মাল্টিপ্লেক্সিং
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### আইটেম কপি-পেস্ট করা
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />

## অবদান রাখা

আমরা অবদানকে স্বাগত জানাই! দয়া করে নির্দেশিকার জন্য [CONTRIBUTING.md](../CONTRIBUTING.md) দেখুন।

## ডকুমেন্টেশন

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - কোডবেসের জন্য ব্যাপক গাইড
- [CONTRIBUTING.md](../CONTRIBUTING.md) - অবদানের নির্দেশিকা

## লাইসেন্স

MIT
