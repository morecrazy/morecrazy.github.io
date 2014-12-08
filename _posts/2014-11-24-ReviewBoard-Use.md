---
layout: post
title: reviewboard使用指南
description: reviewboard使用简单，用户生成好patch文件后，创建request review，指定相应reviewer进行审查，系统会发邮件通知，最后审查通过后便可以commit了。
categories: 运维
tags: [reviewboard, python, apache]
---

## 登录 ##
使用注册的账号访问之前配置的reviewboard站点
## 生成patch文件 ##
本地代码有变更时，可以利用客户端软件，如tortoise SVN生成patch文件，在源码根目录窗口处，点击鼠标右键->TortoiseSVN->Create Patch，见下图：

![生成patch文件] (/assets/images/2014/reviewboard-use01.png)

注意，patch文件可以放置到任意路径，不需要提交到repository。一般放到项目路径下即可，即根目录。reviewboard支持pre-commit方式。但实际使用中可能需要运行代码进行评审，编码人员开发完代码后，可发起一个代码评审的同时将代码commit至版本库中，有助于评审者下载代码实际运行功能。

## 创建一个评审(request review) ##

选择配置库，填入创建patch时的相对路径，下图中填写/，也就意味着是在/目录下创建的patch，选择上一步生成的patch文件

![生成review] (/assets/images/2014/reviewboard-use02.png)

选择patch文件结束后，会出现如下界面，填写评审相关内容，重点是选择评审人，支持选择评审组，以及直接指定评审人，另外可以通过 view diff查看版本变动差异信息

![生成review] (/assets/images/2014/reviewboard-use03.png)

## 进行评审 ##

使用评审人账号登录后，在dashboard下可以发现有新提交上来的review quest

![查看review quest] (/assets/images/2014/reviewboard-use04.png)

点击review quest进入，可以通过view diff查看文件变动情况

![查看diff] (/assets/images/2014/reviewboard-use05.png)

然后针对变更处的代码写上自己的comment，默认情况下，填写comment的时候会开启一个issue。如果觉得变更的代码没有问题，只想注释一下的话，去掉open an issue前面的小勾。

![评审diff] (/assets/images/2014/reviewboard-use06.png)

如果评审人觉得变更的代码没有问题，则直接点击上方的ship it即可。按照pre-commit设置，review quest需要收集ship it的个数，只有达到要求后才能commit。但由于现在svn端缺少这样强制机制，所以现在我们用的时候，暂时将ship it认为是通过的标志。

## 关闭评审并提交或重新评审 ##

评审发起人重新登录系统，在outgoging reviews栏中看到评审过的review quest

![查看评审后的request] (/assets/images/2014/reviewboard-use07.png)

如果评审未发现问题，则SUBMITTED工单，评审完成

![关闭request] (/assets/images/2014/reviewboard-use08.png)

若有问题的化，则需要继续修改代码，重新产生diff信息，使用update diff功能更改版本差异变动信息，继续进行评审。直至关闭。

![重开request] (/assets/images/2014/reviewboard-use09.png)