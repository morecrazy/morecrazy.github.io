---
layout: post
title: mysqldump Got error 1044 Access denied for user 'dsp_engine'@'10.79.%' to database 'dsp_engine' when using LOCK TABLES
description: 解决用mysqldump进行备份时报的错误
categories: 运维
tags: [Mysql, Shell, Mysqldump]
---

在用mysqldump进行数据库备份时，报如下一个错误：
	
	mysqldump: Got error: 1044: Access denied for user 'dsp_engine'@'10.79.%' to database 'dsp_engine' when using LOCK TABLES

从错误的提示信息来看，应该是缺少操作表的权限，ok，采用直观的办法来解决，没有权限就加上权限。

	$ mysql -u root -p
	mysql> GRANT SELECT,LOCK TABLES ON DBNAME.* TO 'username'@'localhost';

或者采用命令参数的方式：

	$ mysqldump --single-transaction -u user -p DBNAME > backup.sql

**--single-transcation**：

InnoDB 表在备份时，通常启用选项 --single-transaction 来保证备份的一致性，实际上它的工作原理是设定本次会话的隔离级别为：REPEATABLE READ，以确保本次会话(dump)时，不会看到其他会话已经提交了的数据。

## Sample Shell Script ##

	#!/bin/bash
	# Purpose: Backup mysql 
	# Author: Vivek Gite; under GNU GPL v2.0+ 
	NOW=$(date +"%d-%m-%Y")
	DEST="/.backup/mysql"
	# set mysql login info
	MUSER="root"# Username
	MPASS='PASSWORD-HERE'   # Password
	MHOST="127.0.0.1"  # Server Name
	 
	# guess binary names
	MYSQL="$(which mysql)"
	MYSQLDUMP="$(which mysqldump)"
	GZIP="$(which gzip)"
	 
	[ ! -d "${DEST}" ] && mkdir -p "${DEST}"
	# get all db names
	DBS="$($MYSQL -u $MUSER -h $MHOST -p$MPASS -Bse 'show databases')"
	for db in $DBS
	do
	 FILE=${DEST}/mysql-${db}.${NOW}-$(date +"%T").gz
	 # get around error 
	 $MYSQLDUMP --single-transaction -u $MUSER -h $MHOST -p$MPASS $db | $GZIP -9 > $FILE
	done