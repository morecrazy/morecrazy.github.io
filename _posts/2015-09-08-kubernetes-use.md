---
layout: post
title: kubernetes使用
description: kubernetes集群能够灵活的扩容，上线和回滚，现在的操作通过kubectl命令进行，后续希望能做成专用的平台性质的系统，而不仅仅是一个工具
categories: kubernetes
tags: [docker, kubernetes]
---


## Step 1:准备镜像 

**Dockerfile**

wiki文档：[使用Dockerfile构建镜像](dockerfile)

详情可以参考下面的链接
[Dockerfile官方创建文档](https://docs.docker.com/reference/builder/)

创建完镜像之后需要push到镜像仓库里，私用镜像仓库地址`dockerhub.codoon.com`

	docker push dockerhub.codoon.com/yourname/yourimage

## Step 2:创建pod

**kubectl**

kubectl是操作kubernetes的客户端工具，在任何一个节点都可以执行。更多信息参考[kubectl命令详细用法](http://kubernetes.io/v1.0/docs/user-guide/kubectl/kubectl.html)

**定义pod**

最简单的`pod`只包含一个`container`。比如下面的pod.yaml文件定义了一个`web server pod`
	
	apiVersion: v1
	kind: Pod //类型为pod
	metadata:
  		name: nginx
	spec:
  		containers:
  		- name: nginx
    	  image: nginx //使用官方nginx镜像
     	  ports:
          - containerPort: 80 //端口为80
 
 **管理pod**
 
 创建一个包含nginx server的pod:
 	
 	$kubectl create -f ./pod.yaml
 	
 列出所有pods: 
 
 	$kubectl get pods
 	
 如果pod ip是能够访问的，应该能够curl
 	
 	$ curl http://$(kubectl get pod nginx -o=template -t={{.status.podIP}})
 
 **管理replicationController**
 
 >官方推荐使用replicationController创建pod，即使只管理一个pod。repclicationController能够管理pods(一组相同labels的pod)，当其中一个pod销毁或者迁移到其他`minion`时，replicationController能够自动恢复pod
 
 replicationController.yaml:
 
 	apiVersion: v1
	kind: ReplicationController
	metadata:
  		name: nginx-controller
	spec:
  		replicas: 2
  		# selector identifies the set of Pods that this
  		# replication controller is responsible for managing
  		selector:
    		app: nginx
  			# podTemplate defines the 'cookie cutter' used for creating
  			# new pods when necessary
  		template:
    		metadata:
      			labels:
        				# Important: these labels need to match the selector above
        				# The api server enforces this constraint.
        		app: nginx
           spec:
              containers:
              - name: nginx
                image: nginx
                ports:
                - containerPort: 80 
 
 创建命令和创建pod命令一样
 列出所有rc
 	
 	$kubectl get rc

## Step 3:创建service

service是pod的抽象，当pod进行扩展的时候，pod的ip会产生变化，service提供了固定的ip地址提供访问

service.yaml:

	apiVersion: v1
	kind: Service
	metadata:
  		name: nginx-service
	spec:
  		ports:
  		- port: 8000 # the port that this service should serve on
    # the container on each pod to connect to, can be a name
    # (e.g. 'www') or a number (e.g. 80)
    	 targetPort: 80
         protocol: TCP
  	# just like the selector in the replication controller,
 	 # but this time it identifies the set of pods to load balance
  	# traffic to.
      selector:
         app: nginx

使用的命令和前面创建pod的命令一样，都是通过yaml文件创建

最后，获取服务的IP和端口进行访问

	$ export SERVICE_IP=$(kubectl get service nginx-service -o=template -t={{.spec.clusterIP}})
	$ export SERVICE_PORT=$(kubectl get service nginx-service -o=template '-t={{(index .spec.ports 0).port}}')
	$ curl http://${SERVICE_IP}:${SERVICE_PORT}
	
	

## Step 4:维护

现阶段的维护主要是使用kubectl这个命令客户端进行的

参考文档[http://kubernetes.io/v1.0/docs/user-guide/kubectl/kubectl.html](http://kubernetes.io/v1.0/docs/user-guide/kubectl/kubectl.html)

**扩容**

    // Scale replication controller named 'foo' to 3.
    $ kubectl scale --replicas=3 replicationcontrollers foo

    // If the replication controller named foo's current size is 2, scale foo to 3.
    $ kubectl scale --current-replicas=2 --replicas=3 replicationcontrollers foo
       

**停服**

    // Scale replication controller named 'foo' to zero
    $ kubectl scale --replicas=3 replicationcontrollers foo

    // stop service 'bar' 
    $ kubectl stop service bar

**上线**

- 手动(推荐）
  
   推荐的方法是创建一个新的`replicationController`，但是只有1个`replicas`，扩展新的rc的`replicas`（+1），减少旧的rc的`replicas`（-1），一个接一个，等旧rc的`replicas`达到0时，就删除旧rc。这样的更新就是可控的。

    比如旧的rc：foo有10个副本，当我需要新上线新的rc: bar时

    // Scale rc named 'foo' to nine and scale rc name 'bar' to 1
    $ kubectl scale --replicas=9 rc foo & kubectl scale --replicas=1 rc bar

- 自动

   使用rolling-update:每隔一段时间使用新的rc模版更新pod

   参考文档: [https://github.com/kubernetes/kubernetes/blob/master/docs/design/simple-rolling-update.md](https://github.com/kubernetes/kubernetes/blob/master/docs/design/simple-rolling-update.md)

    // Update pods of frontend-v1 using new replication controller data in frontend-v2.json.
    $ kubectl rolling-update frontend-v1 -f frontend-v2.json

**回滚**

    // Replace a pod using the data in pod.json.
    $ kubectl replace -f ./pod.json

