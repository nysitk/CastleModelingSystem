# 日本城郭のインタラクティブモデリングシステム
研究で開発している、「日本城郭のインタラクティブモデリングシステム」のアプリケーションです。

## 起動方法
Three.jsと呼ばれるライブラリを用いて、JavaScript APIであるWebGLで動作しています。  
そのため、Webブラウザ上で実行できます。

**事前準備**

npmを用いて、http-serverをインストールします。

```bash
npm install -g http-server
```

**実行**

このレポジトリをCloneしたら、ホームディレクトリで以下のコマンドを入力することにより起動できます。

```bash
http-server
```

コマンドにアドレスが出力されるので、このアドレスをWebブラウザで開くことにより実行できます。

**出力例**

```bash
Starting up http-server, serving ./
Available on:
  http://192.168.1.50:8080
  http://127.0.0.1:8080
Hit CTRL-C to stop the server
```

この `http://`で始まるアドレスをWebブラウザで開きます。

## 動作デモ


https://user-images.githubusercontent.com/61293057/155493486-1874d91c-b8da-46ac-ab56-82020cd19578.mp4

