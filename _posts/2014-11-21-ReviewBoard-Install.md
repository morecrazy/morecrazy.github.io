---
layout: post
title: reviewboard安装记录(CentOS)
description: reviewboard安装步骤详解
categories: 运维
tags: [reviewboard, python]
---

之前项目开发的时候一直缺少code review这个过程，虽然隔一段时间会有代码走查，但是一直缺少一种真正的协同开发手段，不便于新人到来后快速参与项目，成长缓慢。

code review是一个容易被忽视但实际上很重要的过程，它的益处多多。所以为了推广这个过程，首先得搭建好review环境，这里我选用的是reviewboard这样一个开源工具，它使用python编写。reviewboard本身的安装并不复杂，复杂的是依赖环境的配置



官方文档参考：[http://www.reviewboard.org/docs/manual/1.7/admin/installation/linux/](http://www.reviewboard.org/docs/manual/1.7/admin/installation/linux/)

## 安装Python2.7

reviewboard需要python2.5以上的版本

CentOS默认安装的是Python2.4.3
    
    $python -V
    Python 2.4.3

所以需要安装一个更改版本的python，我这里选用的是python2.7

    $ cd /usr/local/src 
    $ wget http://python.org/ftp/python/2.7.4/Python-2.7.4.tgz
    $ tar -zxvf Python-2.7.4.tgz
    $ cd Python-2.7.4
    $ ./configure --with-threads --enable-shared --enable-universalsdk --with-ssl
    $ make && make install
    备注：“--enable-shared”，必须加。保证python会创建共享库（shared library），否则只会创建静态库（static library）
    备注：“--enable-universalsdk”，必须加，以保证python会被编译成64位，因为后面将要安装的mod_python和mod_wsgi需要python的64位共享库。
    备注： “--with-ssl”，必须加。后面使用“easy_install ReviewBoard”安装review board是需要从https下载资源。
    $ echo '/usr/local/lib' > /etc/ld.so.conf.d/python2.7.conf （解决libpython2.7.so.1.0动态库加载失败问题）
    $ ldconfig
    $ /usr/local/bin/python -V
    Python 2.7.4
    $ ls -lst /usr/local/bin/python*
    lrwxrwxrwx 1 root root 　　  7 Apr 27 23:34 /usr/local/bin/python -> python2
    lrwxrwxrwx 1 root root      9 Apr 27 23:34 /usr/local/bin/python2 -> python2.7
    lrwxrwxrwx 1 root root     16 Apr 27 23:34 /usr/local/bin/python2-config -> python2.7-config
    lrwxrwxrwx 1 root root     14 Apr 27 23:34 /usr/local/bin/python-config -> python2-config
    -rwxr-xr-x 1 root root   1674 Apr 27 23:34 /usr/local/bin/python2.7-config
    -rwxr-xr-x 1 root root 10166 Apr 27 23:30 /usr/local/bin/python2.7
    $ mv /usr/bin/python /usr/bin/python.bak （备份一下）
    $ ln -s /usr/local/bin/python /usr/bin/python
    $ cd ~
    $ python -V
    Python 2.7.4  
    $ vi /usr/bin/yum （将第一行由“#!/usr/bin/python”修改成“#!/usr/bin/python2.4”）
    备注：修改yum文件依赖的python版本是必须的，因为当前环境中只有python2.4安装了yum，如果忘记修改python版本，会提示yum模块找不到

至此python2.7安装完成




## 安装数据库

python推荐三种数据库，我用的是mysql:

    yum install mysql mysql-server mysql-devel

## 安装web服务器

有两种组合：

- Apache + mod_wsgi, fastcgi, or mod_python 

- lighttpd + fastcgi

我用的是第一种组合：
    
    $ yum install httpd httpd-devel
    备注：httpd-devel必须要安装，后面的mod_pyghon,mod_wsgi都需要基于apxs
     --------------------------------------至此，apache安装完毕--------------------------------------------------
    $ cd /usr/local/src
    $ wget http://archive.apache.org/dist/httpd/modpython/mod_python-3.3.1.tgz
    $ tar -zxvf mod_python-3.3.1.tgz
    $ cd mod_python-3.3.1
    $ ./configure
    $ make && make install
    备注：mod_python.so的详细路径是：/usr/local/src/mod_python-3.3.1/src/.libs/mod_python.so，该文件会被自动拷贝到/usr/lib64/httpd/modules下，即/etc/httpd/modules
     -------------------------------------至此，mod_python 3.3.1 安装完毕----------------------------------------
    $ cd /usr/local/src
    $ wget http://modwsgi.googlecode.com/files/mod_wsgi-3.4.tar.gz
    $ tar -zxvf mod_wsgi-3.4.tar.gz
    $ cd mod_wsgi-3.4
    $ ./configure
    $ make && make install
    备注：mod_wsgi.so会被拷贝到/usr/lib64/httpd/modules/，即/etc/httpd/modules。
     -----------------------------------至此，mod_wsgi 3.4 安装完毕-----------------------------------------------

## 安装python setuptools

    
    $ yum install python-setuptools
    备注：CentosOS中python-setuptools的默认版本低于0.6c9，所以需要升级。
      针对Python2.7，安装对应python-setuptools，参照：https://pypi.python.org/pypi/setuptools
    $ yum install zlib zlib-devel
    重新源码编译/安装python
    不过，./configure xxxx后，需要vi Modules/Setup，取消如下代码的注释：
      #zlib zlibmodule.c -I$(prefix)/include -L$(exec_prefix)/lib -lz 
    否则setuptools执行时，会报如下错误：
    Traceback (most recent call last):  
     File "<string>", line 1, in <module> 
     zipimport.ZipImportError: can't decompress data; zlib not available  
    $ wget https://pypi.python.org/packages/2.7/s/setuptools/setuptools-0.6c11-py2.7.egg#md5=fe1f997bc722265116870bc7919059ea
    $ chomod +x setuptools-0.6c11-py2.7.egg
    $ ./setuptools-0.6c11-py2.7.egg
    $ ldconfig

因为CentOS中的python-setuptools默认版本是低于0.6c9，所以需要先安装再升级
    `$ easy_install -U setuptools`



## 安装Python Development Header

    $ yum install python-devel
    备注：使用源码安装Python的话，不需要安装python-devel。而且，python27-devel的RPM很难找，就像python27本身一样。

## 安装memcached(可选)

    $ yum install memcached
    $ easy_install python-memcached
    备注：除了要安装memcached以为，还要安装支持memcached的python模块

## 安装patch 

安装patch模块后,reviewboard能使用view diff功能

    $ yum install patch

## 安装ReviewBoard

终于来到了这一步，哈哈

只需要一个命令就能搞定了，自动安装reviewboard需要的依赖（Djblets, Django-Evolution, Django, flup, paramiko and Python Imaging Library)

    $ easy_install ReviewBoard

备注：安装reviewboard时，遇到一个问题， 使用easy_install不能下载ftp://ftp.tummy.com/pub/python-memcached/old-releases/python-memcached-1.45.tar.gz。 但是能通过浏览器或者curl下载该压缩包。

解决方法：

先通过curl下载该包。在使用easy_install -f . python-memcached-1.45.tar.gz 进行离线安装。

然后再执行reviewboard的easy_install.

## 安装database bindings

Mysql:

    $ easy_install mysql-python

## 安装版本控制系统

项目中使用的svn作为版本控制系统，所以此处需要安装subversion

    $ rpm -Uvh http://dl.fedoraproject.org/pub/epel/5/i386/epel-release-5-4.noarch.rpm
    $ yum install subversion subverison-devel apr apr-devel apr-util apr-util-dev pysvn

和安装memcached一样，同时还需要安装支持svn的python模块，这是一个很重要的模块，需要使用它从版本控制系统中拉取代码，创建仓库。有两种工具可供选择

- PySvn

- Subvertpy

相对于Subvertpy来讲PySvn稳定些，所以选用PySvn。但是安装PySvn时，不能用yum，因为系统里的yum是安装在python2.4，用yum安装会将第三方包安装到python2.4的目录下，这很是不爽。下方的链接中提供了多种解决办法，比如使用pip

[http://www.douban.com/group/topic/48222857/](http://www.douban.com/group/topic/48222857/)

实在不行还是采用源码安装

     $ cd /usr/local/src
     $ wget http://pysvn.barrys-emacs.org/source_kits/pysvn-1.7.6.tar.gz
     $ tar zxvf pysvn-1.7.6.tar.gz
     $ cd pysvn-1.7.6/Source
     $ python setup.py backport 验证与python的兼容
     $ python setup.py configure
     $ python setup.py install

备注：安装过程中可能会提示动态库找不到
安装好后将相应的文件复制到python2.7的第三方包目录下

    $ mkdir /usr/lib64/python2.7/site-packages/pysvn
    $ cp pysvn/__init__.py /usr/lib64/python2.7/site-packages/pysvn
    $ cp pysvn/_pysvn*.so /usr/lib64/python2.7/site-packages/pysvn

PySvn的安装步骤都是参照源码包中的INSTALL.html文件

安装完成后验证是否安装成功
    
    $python
    >>import pysvn
    >>

至此ReviewBoard的安装算是完成，要使用的话还得进行配置。
