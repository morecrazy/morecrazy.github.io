---
layout: post
title: kubernetes集群的安装和部署
description: kubernetes集群包括三个部分:master节点，minion节点和网络基础组件。此处使用flanneld提供网络服务，使节点之间能够通信
categories: kubernetes
tags: [docker, kubernetes, flanneld]
---


# Kubernetes 集群的安装和部署

## 部署

kubernetes是一个master/slave架构，现版本kubernetes支持单节点master，多节点slave

**master**

- ip: 192.168.1.10
- kubernetes: Release 1.0.1
- centos: 7.0
- docker: 1.7.1

**slave(minion)**

- ip: 192.168.1.11
- kubernetes: Release 1.0.1
- centos: 7.0
- docker: 1.7.1

> 初步部署使用两台机器，以后扩展节点的时候应该使用minion节点的配置；

## 准备

**step 1:**

关闭防火墙，避免和docker的iptables产生冲突

	$ systemctl stop firewalld
	$ systemctl disable firewalld
	
**step 2:**

安装NTP

	$ yum -y install ntp
	$ systemctl start ntpd
	$ systemctl enable ntpd
	
## 部署master

**step 1:**

安装etcd和kubernetes

	$ yum -y install etcd kubernetes
	
**step 2:**

修改etcd的配置文件`/etc/etcd/etcd.conf`

	ETCD_NAME=default
	ETCD_DATA_DIR="/var/lib/etcd/default.etcd"
	ETCD_LISTEN_CLIENT_URLS="http://0.0.0.0:2379"
	
**step 3:**

修改kubernetes API server的配置文件`/etc/kubernetes/apiserver`

	KUBE_API_ADDRESS="--address=0.0.0.0"
	KUBE_API_PORT="--port=8080"
	KUBELET_PORT="--kubelet_port=10250"
	KUBE_ETCD_SERVERS="--etcd_servers=http://192.168.1.10:2379"
	KUBE_SERVICE_ADDRESSES="--portal_net=10.254.0.0/16"
	KUBE_ADMISSION_CONTROL="--admission_control=NamespaceAutoProvision,LimitRanger,ResourceQuota"
	KUBE_API_ARGS=""

**step 4:**

定义etcd中的网络配置，minions中的flannel service会拉取此配置

	$etcdctl mk /coreos.com/network/config '{"Network":"172.17.0.0/16"}'
	
**step 5:**

启动etcd, kube-apiserver, kube-controller-manager和kube-scheduler服务

	$for SERVICES in etcd kube-apiserver kube-controller-manager kube-scheduler; do 
    systemctl restart $SERVICES
    systemctl enable $SERVICES
    systemctl status $SERVICES 
	done
	
**step 6:**

这个时候还获取不到nodes

	$kubectl get minions
	NAME             LABELS        STATUS

## 配置minions

**step 1:**

安装flannel和kubernetes

	$ yum -y install flannel kubernetes
	
**step 2:**

修改flannel配置文件

	FLANNEL_ETCD="http://192.168.1.10:2379"
	FLANNEL_ETCD_KEY="/coreos.com/network"
	FLANNEL_OPTIONS="--iface=eth0"
	
**step 3:**

在当前目录创建一个`flannel-config.json`的配置文件，它应该包含如下内容:

	{
	"Network": "172.17.0.0/16",
	"SubnetLen": 24,
	"Backend": {
		"Type": "vxlan",
		 "VNI": 7890
     }
	 }
	 
**step 4:**

将配置上传到etcd server

	curl -L http://192.168.1.10:2379/v2/keys/coreos.com/network/config -XPUT --data-urlencode value@flannel-config.json
	
**step 5:**

修改kubernetes默认的配置`/etc/kubernetes/config`

	KUBE_MASTER="--master=http://192.168.1.10:8080"
	
**step 6:**

修改kubelet服务的配置文件`/etc/kubernetes/kubelet`

	KUBELET_ADDRESS="--address=0.0.0.0"
	KUBELET_PORT="--port=10250"
	# change the hostname to this host’s IP address
	KUBELET_HOSTNAME="--hostname_override=192.168.1.11"
	KUBELET_API_SERVER="--api_servers=http://192.168.50.130:8080"
	KUBELET_ARGS=""
	
> 不同minion节点只需要更改`KUBELET_HOSTNAME` 为minion实际的ip地址即可	

**step 7:**

启动flanneld服务

	$systemctl restart flanneld
	$systemctl status flanneld
	
查看网卡

	$ ip a | grep flannel | grep inet
	inet 172.17.94.0/16 scope global flannel0
**step 8:**

查看flanneld的虚拟网卡是否配置好了路由

	$route -n
	Kernel IP routing table
	Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
	0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 enp2s0
	172.17.0.0      0.0.0.0         255.255.0.0     U     0      0        0 flannel0
	172.17.94.0     0.0.0.0         255.255.255.0   U     0      0        0 docker0
	192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 enp2s0

> 如果没有出现flannel0的路由关系，说明还没有生效，我采用的方法是systemctl reboot，一定要保证路由生效，不然网络环境就没法联通，minion之间无法通信

**step 9:**

启动docker

修改docker的service文件：`/usr/lib/systemd/system/docker.service`

	[Unit]
	Description=Docker Application Container Engine
	Documentation=http://docs.docker.com
	After=network.target docker.socket
	Requires=docker.socket

	[Service]
	Type=notify
	EnvironmentFile=-/run/flannel/subnet.env
	EnvironmentFile=-/etc/sysconfig/docker
	EnvironmentFile=-/etc/sysconfig/docker-storage
	ExecStart=/usr/bin/docker -d -H fd:// $OPTIONS $DOCKER_STORAGE_OPTIONS --bip=${FLANNEL_SUBNET} --mtu=${FLANNEL_MTU}
	LimitNOFILE=1048576
	LimitNPROC=1048576

	[Install]
	WantedBy=multi-user.target

>目的是为了修改docker的网桥配置，将docker的网桥加入flannel的子网

	systemctl daemon-reload
	systemctl restart docker
	systemctl enable docker
	systemctl status docker
**step 10:**
启动kube-proxy, kubelet服务

	$ for SERVICES in kube-proxy kubelet ; do 
    systemctl restart $SERVICES
    systemctl enable $SERVICES
    systemctl status $SERVICES 
	done


**step 11:**

查看minions的状态:

	$kubectl -s "http://192.168.1.10:8080" get nodes
	NAME           LABELS                                STATUS
	192.168.1.10   kubernetes.io/hostname=192.168.1.10   Ready
	192.168.1.11   kubernetes.io/hostname=192.168.1.11   Ready


现在kubernetes的集群已经搭建好了，能够创建pods

**参考链接**

- [http://www.severalnines.com/blog/installing-kubernetes-cluster-minions-centos7-manage-pods-services](http://www.severalnines.com/blog/installing-kubernetes-cluster-minions-centos7-manage-pods-services)

- [http://www.colliernotes.com/2015/01/flannel-and-docker-on-fedora-getting.html](http://www.colliernotes.com/2015/01/flannel-and-docker-on-fedora-getting.html)

- [http://www.slideshare.net/lorispack/using-coreos-flannel-for-docker-networking](http://www.slideshare.net/lorispack/using-coreos-flannel-for-docker-networking)


