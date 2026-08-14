<div align="center">

<img src="../assets/banner.png" alt="Isenax - オープンソースのアイソメトリック図作成ツール" width="100%" />

</div>



<p align="center">
 <a href="../README.md">English</a> | <a href="README.cn.md">简体中文</a> | <a href="README.es.md">Español</a> | <a href="README.pt.md">Português</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.bn.md">বাংলা</a> | <a href="README.ru.md">Русский</a> | <a href="README.id.md">Bahasa Indonesia</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.it.md">Italiano</a> | <a href="README.pl.md">Polski</a> | <a href="README.tr.md">Türkçe</a>
</p>

## 注記:
このリポジトリ(Isenax)は [Abrar74774/FossFLOW](https://github.com/Abrar74774/FossFLOW) の派生プロジェクトであり、それ自体は stan-smith/FossFLOW のフォーク(さらにその元は [markmanx/isoflow](https://github.com/markmanx/isoflow) のフォーク)です。もともとは PR を通じて元のリポジトリに貢献する目的で作られましたが、作者の GitHub ユーザー名が [mug-book-droid](https://github.com/mug-book-droid) に変更され、アクティビティが非公開に設定されたため(アカウントが停止された可能性もあります)、元のリポジトリにはアクセスできなくなっています。

現在、このリポジトリ(Isenax と改名)を FossFLOW の開発の延長として継続していく予定です。PR による貢献もいつでも歓迎します。

取得した元リポジトリの最終状態は `backup/stan-smith-FossFLOW` ブランチで確認できます。

---

Isenax は、美しいアイソメトリック図を作成できる強力なオープンソースの Progressive Web App(PWA)です。React と <a href="https://github.com/markmanx/isoflow">Isoflow</a> ライブラリ(フォークされ npm には fossflow として、このリポジトリでは isenax として公開)をベースに構築されており、ブラウザ内で完全に動作し、オフラインにも対応しています。

---
<p align="center">
<b>オンラインで試す --> https://nyangko.github.io/Isenax/ <-- </b>
</p>
 
<img width="100%" alt="Isenax-Isometric-Diagramming-Tool" src="https://github.com/user-attachments/assets/15956888-991a-4b5e-9849-dbd82d6f9308" />

---------

## 🐳 Docker でクイックデプロイ

```bash
# Docker Compose を使う場合(推奨・永続ストレージ付き)
docker compose up

# または Docker Hub から直接実行(永続ストレージ付き)
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams nyangko/isenax:latest
```

Docker ではサーバーストレージがデフォルトで有効になっています。ダイアグラムはホスト側の `./diagrams` に(デフォルトでは root 権限で)保存されます。保存に使うユーザー/グループ ID を変更するには `PUID`、`PGID` 環境変数を設定してください。

サーバーストレージを無効化するには `ENABLE_SERVER_STORAGE=false` を設定してください:
```bash
docker run -p 80:80 -e ENABLE_SERVER_STORAGE=false nyangko/isenax:latest
```

### HTTP Basic 認証(任意)

HTTP Basic Auth で Isenax インスタンスを保護できます:

```bash
# Docker Compose を使う場合
HTTP_AUTH_USER=admin HTTP_AUTH_PASSWORD=secret docker compose up

# または docker run を使う場合
docker run -p 80:80 \
  -e HTTP_AUTH_USER=admin \
  -e HTTP_AUTH_PASSWORD=secret \
  nyangko/isenax:latest
```

> **注意**: 認証を有効にするには両方の変数を設定する必要があります。どちらか一方でも空の場合、ログインなしでアクセスできてしまいます。

## クイックスタート(ローカル開発)

```bash
# リポジトリをクローン
git clone https://github.com/nyangko/Isenax
cd Isenax

# 依存関係をインストール
npm install

# ライブラリをビルド(初回のみ必要)
npm run build:lib

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## モノレポ構成

このリポジトリは4つのパッケージからなるモノレポです:

- `packages/isenax-lib` - ネットワーク図を描画する React コンポーネントライブラリ(Rslib/Rspack でビルド)
- `packages/isenax-app` - ライブラリをラップして表示する Progressive Web App(RSBuild でビルド)
- `packages/isenax-backend` - 図のオプションのセルフホスト型ストレージを提供する Express サーバー(Docker デプロイで使用)
- `packages/isenax-mcp` - 外部のAIエージェントが図を直接読み取り、作成、編集できるようにするMCP(Model Context Protocol)サーバー(stdio または Streamable HTTP)

### 開発コマンド

```bash
# 開発
npm run dev          # アプリの開発サーバーを起動
npm run dev:lib      # ライブラリのウォッチモード

# ビルド
npm run build        # ライブラリとアプリの両方をビルド
npm run build:lib    # ライブラリのみビルド
npm run build:app    # アプリのみビルド

# テスト & リント
npm test             # ユニットテストを実行
npm run lint         # リントエラーを確認

# E2E テスト(Selenium)
cd e2e-tests
./run-tests.sh       # E2E テストを実行(Docker と Python が必要)

# 公開
npm run publish:lib  # ライブラリを npm に公開
```

## 使い方

### 図を作成する

1. **アイテムを追加する**:
   - 右上メニューの「+」ボタンを押すと、左側にコンポーネントライブラリが表示されます
   - ライブラリからコンポーネントをキャンバスにドラッグ&ドロップしてください
   - またはグリッド上で右クリックし、「ノードを追加」を選択してください

2. **アイテムを接続する**:
   - コネクターツールを選択します(「C」キーまたはコネクターアイコンをクリック)
   - **クリックモード**(デフォルト):最初のノードをクリックしてから、2番目のノードをクリック
   - **ドラッグモード**(任意):最初のノードから2番目のノードまでドラッグ
   - 設定 → コネクタータブでモードを切り替えられます

3. **作業を保存する**:
   - **クイック保存** - ブラウザセッションに保存
   - **エクスポート** - JSON ファイルとしてダウンロード
   - **インポート** - JSON ファイルから読み込み

4. **レイヤーパネルで整理する**:
   - ツールバーのレイヤーボタンを押すと、キャンバス上のすべてのノード・コネクター・エリア・テキストが一覧表示されます
   - 一覧で項目を選ぶと、同じパネルの「編集」タブでそのまま編集できます
   - 画面が狭い場合は、キャンバス右下のボタンからボトムシートとして開きます

### ストレージオプション

- **セッションストレージ**: ブラウザを閉じると消える一時保存
- **エクスポート/インポート**: JSON ファイルとして永続保存
- **自動保存**: 5秒ごとに変更内容をセッションへ自動保存

### MCP連携(AIエージェント)

Isenaxには、外部のAIエージェント(Claude など)が図を直接読み取り、作成、編集できるMCPサーバーが同梱されています:

1. **設定 → MCP** を開いてオンにすると、接続URLとBearerトークンが表示されます。
2. そのURL/トークンでMCPクライアントを接続します(`packages/isenax-mcp` は stdio と Streamable HTTP の両方のトランスポートに対応)。
3. エージェントによる変更は、その図を表示している開いているタブにリフレッシュ不要でリアルタイムに反映され、作業中は「MCPが作成中...」という表示が出ます。

組み込みアイコンはid のみでやり取りされ(base64データはエージェントに送られません)、`update_diagram_patch` を使うとエージェントはモデル全体を送り直さずに変更したフィールドだけを送信できます。

## 最近追加された機能

### コネクターの多重化
<img src="../demos/connectors.gif" alt="Multiplexed connectors demo" />

### アイテムのコピー&ペースト
<img src="../demos/copy-paste-demo.gif" alt="Copy pasting demo" />


## コントリビューション

コントリビューションを歓迎します!ガイドラインは [CONTRIBUTING.md](../CONTRIBUTING.md) をご覧ください。

## ドキュメント

- [ISENAX_ENCYCLOPEDIA.md](ISENAX_ENCYCLOPEDIA.md) - コードベースの包括的なガイド
- [CONTRIBUTING.md](../CONTRIBUTING.md) - コントリビューションガイドライン

## ライセンス

MIT
