---
layout: post
title: Kubernetes 介绍
description: kubernetes是一个开源的容器集群管理系统，kubernetes的目的是使容器或微服务的部署更简单，并提供强大的功能
categories: Kubernetes
tags: [docker, RESTFul, Kubernetes]
---

# Kubernetes

##简介
kubernetes是一个开源的容器集群管理系统，kubernetes的目的是使容器或微服务的部署更简单，并提供强大的功能

Kubernetes提供用于应用程序部署，调度，更新，维护和伸缩的机制。 Kubernetes的一个重要特点是，它可以主动管理容器，以确保集群的状态持续匹配用户的意图。

##架构
![架构图](/assets/images/2015/kubernetes-arch.png)



**对象**



Kubernetes以RESTFul形式开放接口，用户可操作的REST对象有三个：

   - pod：是`Kubernetes`最基本的部署调度单元，可以包含`container`，逻辑上表示某种应用的一个实例。
   >比如一个web站点应用由前端、后端及数据库构建而成，这三个组件将运行在各自的容器中，那么我们可以创建包含三个`container`的`pod`。
   
   - service: 是`pod`的路由代理抽象，用于解决`pod`之间的服务发现问题。
   >因为`pod`的运行状态可动态变化(比如切换机器了、缩容过程中被终止了等)，所以访问端不能以写死IP的方式去访问该pod提供的服务。`service`的引入旨在保证`pod`的动态变化对访问端透明，访问端只需要知道`service`的地址，由`service`来提供代理
   - replicationController:是`pod`的复制抽象，用于解决`pod`的扩容缩容问题。
   >通常，分布式应用为了性能或高可用性的考虑，需要复制多份资源，并且根据负载情况动态伸缩。通过`replicationController`我们可以指定一个应用需要几份复制，`Kubernetes`将为每份复制创建一个`pod`，并且保证实际运行`pod`数量总是与该复制数量相等(例如，当前某个`pod`宕机时，自动创建新的`pod`来替换)。
   
   可以看到，`service`和`replicationController`只是建立在`pod`之上的抽象，最终是要作用于`pod`的，那么它们如何跟`pod`联系起来呢？这就要引入`label`的概念：`label`其实很好理解，就是为`pod`加上可用于搜索或关联的一组key/value标签，而`service`和`replicationController`正是通过`label`来与`pod`关联的。如下图所示，有三个`pod`都有label为"app=backend"，创建service和`replicationController`时可以指定同样的label:"app=backend"，再通过label selector机制，就将它们与这三个pod关联起来了。例如，当有其他frontend pod访问该`service`时，自动会转发到其中的一个backend pod。
   
   ![标签查找] (/assets/images/2015/labels.png)
   

**组件**


master运行三个组件

- apiserver:作为`kubernetes`系统的入口，封装了核心对象的增删改查操作，以RESTFul接口方式提供给外部客户和内部组件调用。它维护的REST对象将持久化到etcd（一个分布式强一致性的key/value存储）。

- scheduler:负责集群的资源调度，为新建的pod分配机器。这部分工作分出来变成一个组件，意味着可以很方便地替换成其他的调度器。

- controller-manager:负责执行各种控制器，目前有两类：

slave（称作minion)运行两个组件

- kubelet:负责管控`docker`容器，如启动/停止、监控运行状态等。它会定期从`etcd`获取分配到本机的`pod`，并根据`pod`信息启动或停止相应的容器。同时，它也会接收`apiserver`的HTTP请求，汇报pod的运行状态。
- proxy:负责为`pod`提供代理。它会定期从`etcd`获取所有的`service`，并根据`service`信息创建代理。当某个客户`pod`要访问其他`pod`时，访问请求会经过本机`proxy`做转发。

> 每个Kubernetes节点都运行一个kube-proxy这么一个服务代理,它 watch kubernetes 集群里 service 和 endpoints(label是某一特定条件的pods)这两个对象的增加或删除,　并且维护一个service 到 endpoints的映射. 他使用iptables REDIRECT target将对服务的请求流量转接到本地的一个port上,　然后再将流量发到后端,　这样的转发还支持一些策略,　如round robin等，所以我们可以把他看成是一个具有高级功能的反向代理.

##工作流

**创建pod**
![创建pods](/assets/images/2015/createpod.png)

**创建replicationController(rc)**
![创建rc](/assets/images/2015/replicationController.png)

**创建service(svc)**
![创建svc](/assets/images/2015/service.png)


