---
layout: page
title: About
description: 十年磨一剑
keywords: Allen Zhang, morecrazy
comments: true
menu: 关于
permalink: /about/
---

在山的那边海的那边，有一群程序员，他们聪明又努力，可爱却没钱

## 联系

{% for website in site.data.social %}
* {{ website.sitename }}：[@{{ website.name }}]({{ website.url }})
{% endfor %}

## Skill Keywords

{% for category in site.data.skills %}
### {{ category.name }}
<div class="btn-inline">
{% for keyword in category.keywords %}
<button class="btn btn-outline" type="button">{{ keyword }}</button>
{% endfor %}
</div>
{% endfor %}
