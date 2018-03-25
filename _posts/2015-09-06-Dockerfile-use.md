---
layout: post
title: 使用Dockerfile构建镜像
description: docker镜像的构建方式有两种，一种是commit的方式，一种是编写dockerfile。dockerfile灵活，可读性强。项目里一般采用此方式进行镜像的build,push
categories: docker
tags: [docker, images, container]
---


# 使用Dockerfile构建镜像

## 如何使用

Dockerfile用来创建一个自定义的image,包含了用户指定的软件依赖等。在当前目录下包含Dockerfile,使用命令build来创建新的image,并命名为`yourname`/`yourproject`

	docker build -t yourname/yourproject .

**Dockerfile文件示例**

	# This dockerfile uses the go image
	# VERSION 2 - EDITION 1
	# Author: liaoqiang
	# Command format: Instruction 	[arguments / command] ..

	# Base image to use, this must be set as the first line
	FROM dockerhub.codoon.com/godep

	# Maintainer: docker_user <docker_user at email.com> (@docker_user)
	MAINTAINER liaoqiang liaoqiang@codoon.com

	# Set the WORKDIR
	WORKDIR /go/src/backend/frequency-control

	# Set LABEL
	LABEL name="frequency-control" author="liaoqiang" branch="master"

	# Set ENV
	ENV GOENV="ONLINE"

	# Set EXPOSE
	EXPOSE 3095

	# Commands to update the image
	ADD . /go/src/backend/frequency-control
	RUN godep go install
	RUN mkdir -p log
	RUN ln -sf /dev/stdout /go/src/backend/frequency-control/log/frequency-control.log
	RUN ln -sf /dev/stderr /go/src/backend/frequency-control/log/frequency-control.log.wf


	# Commands when creating a new container
	CMD frequency-control -c conf/frequency-control.conf
	

## Dockerfile关键字

格式如下:

	# Comment
	INSTRUCTION arguments
	
**FROM**
基于哪个镜像

**RUN**
安装软件用

**MAINTAINER**

镜像创建者

**CMD**

container启动时执行的命令，但是一个Dockerfile中只能有一条CMD命令，多条则只执行最后一条CMD.


CMD主要用于container时启动指定的服务，当docker run command的命令匹配到CMD command时，会替换CMD执行的命令。

**ENTRYPOINT**

container启动时执行的命令，但是一个Dockerfile中只能有一条ENTRYPOINT命令，如果多条，则只执行最后一条


ENTRYPOINT没有CMD的可替换特性

**USER**

使用哪个用户跑container
如：

	ENTRYPOINT ["memcached"]
	USER daemon
	
**EXPOSE**

container内部服务开启的端口。

**ENV**

用来设置环境变量，比如：

	ENV LANG en_US.UTF-8
	ENV LC_ALL en_US.UTF-8
	
**ADD**


将文件<src>拷贝到container的文件系统对应的路径<dest>

所有拷贝到container中的文件和文件夹权限为0755,uid和gid为0

**VOLUME**

可以将本地文件夹或者其他container的文件夹挂载到container中。

**WORKDIR**

切换目录用，可以多次切换(相当于cd命令)，对RUN,CMD,ENTRYPOINT生效

## 设置镜像标签

在提交更改和构建之后为镜像来添加标签(tag)。我们可以使用 docker tag 命令。

	docker tag yourname/yourproject dockerhub.codoon.com/yourname/yourproject:develop

## 推送镜像到docker hub

一旦你构建或创建了一个新的镜像，你可以使用 docker push 命令将镜像推送到 Docker Hub 。这样你就可以分享你的镜像了，镜像可以是公开的，或者你可以把镜像添加到你的私有仓库中

	docker push dockerhub.codoon.com/yourname/yourproject:develop



