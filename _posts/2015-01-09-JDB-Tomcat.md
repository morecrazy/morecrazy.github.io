---
layout: post
title: 使用JDB调试tomcat下的web工程
description: 由于本地集成开发环境调试整个工程比较困难，一般是调试单元测试用例。所以希望找到一种能在服务器环境进行调试的方法。jdb是一种很好的tomcat工程调试工具
categories: java基础
tags: [Tomcat, jdb]
---

Tomcat7设置

在catalina.sh文件头一行添加

JPDA_SUSPEND='y'

这会让Tomcat应用程序启动的时候暂停运行，等待jdb客户端连接后发出run命令才开始运行

以远程调试模式启动Tomcat程序，默认监听端口8000

./catalina.sh jpda start

jdb连接

使用命令连接tomcat服务器

jdb -attach 192.168.1.200:8000 -sourcepath "/data0/src" 

-sourcepath 后面可以接多个代码目录，用:分开

jdb调试

连接成功后，可以用下面的命令设置断点：

stop at 类名：行号

运行run,服务开始启动，然后通过网页发送请求，断点起作用了。