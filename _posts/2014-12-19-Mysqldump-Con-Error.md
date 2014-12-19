---
layout: post
title: mysqldump: Error 2013: Lost connection to MySQL server during query when dumping table `fee_record_2013_11` at row: 1066768
description: mysqldump进行数据库备份时，由于mysqldump处理不过来server端的数据，server断开连接报错
categories: 运维，问题
tags: [Mysql, Mysqldump]
---

在使用mysqldump命令备份数据库的时候，
	
	$ mysqldump --single-transaction -u user -p DBNAME > backup.sql

报出以下错误：
	
	mysqldump: Error 2013: Lost connection to MySQL server during query when dumping table `fee_record_2013_11` at row: 1066768

大概说是因为mysqldump来不及接受mysql server端发送过来的数据，Server端的数据就会积压在内存中等待发送，这个等待不是无限期的，当Server的等待时间超过net_write_timeout（默认是60秒）时它就失去了耐心，mysqldump的连接会被断开，同时抛出错误Got error: 2013: Lost connection。
 
增加net_write_timeout可以解决上述的问题的。在实践中发现，在增大 net_write_timeout后，Server端会消耗更多的内存，有时甚至会导致swap的使用（并不确定是不是修改 net_write_timeout所至）。建议在mysqldump之前修改net_write_timeout为一个较大的值（如1800），在 mysqldump结束后，在将这个值修改到默认的60。
 
在sql命令行里面设置临时全局生效用类似如下命令：
SET GLOBAL net_write_timeout=1800;
 
修改了这个参数后再备份，不再报错

## 修改方法 ##

	mysql> show variables like "%timeout%";
	+----------------------------+-------+
	| Variable_name              | Value |
	+----------------------------+-------+
	| connect_timeout            | 5     |
	| delayed_insert_timeout     | 300   |
	| innodb_lock_wait_timeout   | 50    |
	| innodb_rollback_on_timeout | OFF   |
	| interactive_timeout        | 28800 |
	| net_read_timeout           | 30    |
	| net_write_timeout          | 60    |
	| slave_net_timeout          | 3600  |
	| table_lock_wait_timeout    | 50    |
	| wait_timeout               | 28800 |
	+----------------------------+-------+
	10 rows in set (0.00 sec)
	 
	mysql> set net_write_timeout=1800;
	 
	mysql> show variables like "%timeout%";
	+----------------------------+-------+
	| Variable_name              | Value |
	+----------------------------+-------+
	| connect_timeout            | 5     |
	| delayed_insert_timeout     | 300   |
	| innodb_lock_wait_timeout   | 50    |
	| innodb_rollback_on_timeout | OFF   |
	| interactive_timeout        | 28800 |
	| net_read_timeout           | 30    |
	| net_write_timeout          | 1800  |
	| slave_net_timeout          | 3600  |
	| table_lock_wait_timeout    | 50    |
	| wait_timeout               | 28800 |
	+----------------------------+-------+
	10 rows in set (0.00 sec)

**注**：set net_write_timeout只能在当前会话有效，如果退出以后再登录，会发现变量值又恢复原样。如果想让全局失效，使用set GLOBAL net_write_timeout=1800。不过set GLOBAL需要相应的权限。
