---
layout: post
title: Hive查询数据后导入到本地文件
description: 查询hive表的查询语句和sql语句一样，使用select * 就能查出相应的数据。此处介绍两种将查出后的数据导入到本地文件
categories: 大数据
tags: [Hive, sql]
---

## 方法一 ##

    hive (stuchoosecourse) > insert overwrite local directory '/home/exportDir'
                                   > select * from hiddenipinfo;
	Total MapReduce jobs = 1
    Launching Job 1 out of 1
    Number of reduce tasks is set to 0 since there's no reduce operator
    Starting Job = job_201312042044_0026, Tracking URL = http://Master:50030/jobdetails.jsp?jobid=job_201312042044_0026
    Kill Command = /home/landen/UntarFile/hadoop-1.0.4/libexec/../bin/hadoop job  -kill job_201312042044_0026
    Hadoop job information for Stage-1: number of mappers: 1; number of reducers: 0
    2013-12-09 19:33:35,962 Stage-1 map = 0%,  reduce = 0%
    2013-12-09 19:33:41,937 Stage-1 map = 100%,  reduce = 0%, Cumulative CPU 0.4 sec
    2013-12-09 19:33:43,008 Stage-1 map = 100%,  reduce = 0%, Cumulative CPU 0.4 sec
    2013-12-09 19:33:44,093 Stage-1 map = 100%,  reduce = 0%, Cumulative CPU 0.4 sec
    2013-12-09 19:33:45,146 Stage-1 map = 100%,  reduce = 0%, Cumulative CPU 0.4 sec
    2013-12-09 19:33:46,233 Stage-1 map = 100%,  reduce = 0%, Cumulative CPU 0.4 sec
    2013-12-09 19:33:47,271 Stage-1 map = 100%,  reduce = 0%, Cumulative CPU 0.4 sec
    MapReduce Total cumulative CPU time: 400 msec
    Ended Job = job_201312042044_0026
    Copying data to local directory /home/exportDir
    Copying data to local directory /home/exportDir
    3 Rows loaded to /home/exportDir
    MapReduce Jobs Launched: 
    Job 0: Map: 1   Cumulative CPU: 0.4 sec   HDFS Read: 490 HDFS Write: 233 SUCCESS
    Total MapReduce CPU Time Spent: 400 msec
    OK
    ipcountrycodecountrynameregionregionnamecitylatitudelongitudetimezone
    Time taken: 80.784 seconds

导出后的文件内容如下

    2014-08-06 00:00:00.392^A14.16.115.222^A14.16.115.222_1407254306.345954^A2a73cbeb-5922-4bd1-b94e-fbef05b312f1^A26183^A3991164315_PINPAI-CPC^A2784^A93
    000^A1^A0^A1929597471|1|1^APDPS000000046012^A108482^APC^Aimage^A\N^A20140806
    2014-08-06 00:00:04.406^A106.112.51.46^A106.112.51.123_1402802789.167232^A81cbbbec-0eb0-4f34-ac7d-b682b79b5469^A26474^A5167809839_PINPAI-CPC^A7676^A7
    5084^A1^A0^A-906957921|2|1^APDPS000000049736^A109319^APC^Aimage^A\N^A20140806

但是Hive使用 ^A 符号作为域的分隔符，所以需要sed命令替换一下：


    sed -e 's/\x01/\t/g' 000000_0 > (重定向到新文件) click.txt

## 方法二 ##

直接使用重定向到文件

    $hive -e "select * from table where id > 10" > ~/sample_output.txt



