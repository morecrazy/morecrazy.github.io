---
layout: post
title: reviewboard配置
description: reviewboard安装好以后需要配置到apache上。需要注意一些500或者400错误
categories: 运维
tags: [reviewboard, python, apache]
---
reviewboard安装好后，需要在apache上配置站点才能访问，包括域名，安装根目录等等

官方文档地址:[https://www.reviewboard.org/docs/manual/1.7/admin/installation/creating-sites/#creating-sites](https://www.reviewboard.org/docs/manual/1.7/admin/installation/creating-sites/#creating-sites)

## 创建reviewboard站点 ##
    sudo rb-site install /var/www/reviewboard

之后会有一些配置向导

	· Domain = localhost
    · Root Path = /
    · Media URL = media/
    · Database Type = mysql
    · Database Name = reviewboard
    · Database server = localhost
    · Database username = 'reviewboard' 
    · Database password = 'reviewboard' 
    · Cache Type = memcache
    · Memcache Server = memcached://localhost:11211/ 
    · Webserver = apache
    · Python loader = modpython
一般按照默认的配置就可以了

## 启动apache ##
	sudo chown apache /var/www/reviewboard/*
	cp /var/www/reviewboard/conf/apache-wsgi.conf /etc/httpd/conf.d/
	service httpd restart
使用域名加端口号（默认端口80）就能访问了。域名没配好的话，直接使用地址访问：http://XXXX:80/
打开之后就可以看见登录的界面了：
![reviewboard登录界面] (/assets/images/2014/reviewboard-login.png)

不过有几个地方需要注意，如果访问的时候报500错误，可以在/etc/httpd/conf/httpd.conf根目录加上这样的配置：

	<Directory />
    Options FollowSymLinks
    AllowOverride None
    Satisfy Any
	</Directory>

Satisfy Any后就没有500错误

如果有报400的错误，说明是访问url有问题，需要更改一个地方 
	
	vim /var/www/reviewboard/conf/settings_local.py

修改文件中ALLOWED_HOSTS = ['*']