---
layout: post
title: 同时管理多个ssh私钥
description: 有时候我们需要多个私钥来登录多个域名，如果采用备份的方式，操作起来比较麻烦，并且需要手工干预。更好的方式是采用配置文件能够根据登录域的不同采用不同的私钥
categories: ssh
tags: [git, ssh]
---

在设置github的时候，官方的说明文档要求备份当前的`id_rsa`，然后生成一份新的私钥用于github的登陆。如果真这样做，那么新的私钥是无法再继续登陆之前的机器的。这种方法有点暴力…
还好ssh可以让我们通过不同的私钥来登陆不同的域。

首先，在新增私钥的时候，通过指定不同的文件名来生成不同的私钥文件

```
ssh-keygen -t rsa -f ~/.ssh/id_rsa.work -C "Key for Work stuff"
ssh-keygen -t rsa -f ~/.ssh/id_rsa.github -C "Key for GitHub stuff"
```

新增ssh配置文件，并修改权限

```
touch ~/.ssh/config
chmod 600 ~/.ssh/config
```

修改`config`文件的内容

```
Host *.workdomain.com
    IdentityFile ~/.ssh/id_rsa.work
    User lee
 
Host github.com
    IdentityFile ~/.ssh/id_rsa.github
    User git
```
这样在登陆的时候，ssh会根据登陆不同的域来读取相应的私钥文件

```
OpenSSH_6.2p2, OSSLShim 0.9.8r 8 Dec 2011
debug1: Reading configuration data /Users/zhanghan/.ssh/config
debug1: /Users/zhanghan/.ssh/config line 1: Applying options for github.com
debug1: Reading configuration data /etc/ssh_config
debug1: /etc/ssh_config line 20: Applying options for *
debug1: Connecting to github.com [192.30.252.131] port 22.
debug1: Connection established.
debug1: identity file /Users/zhanghan/.ssh/id_rsa.github type 1
debug1: identity file /Users/zhanghan/.ssh/id_rsa.github-cert type -1
```

