---
layout: post
title: 结合源码分析java ArrayList删除特定元素的方法
description: ArrayList删除和添加元素时，都需要重新复制元素。但删除元素时，有些地方需要注意，稍微大意，就容易出错。最常见的一种异常是：java.util.concurrentmodificationexception。本篇文章中会分析几种删除特定元素的方法，并结合源码给出分析
categories: java基础
tags: [ArrayList, Collection]
---

ArrayList是最常用的一种java集合，在开发中我们常常需要从ArrayList中删除特定元素。有几种常用的方法:

最朴实的方法，使用下标的方式：

	ArrayList<String> al = new ArrayList<String>();
		al.add("a");
		al.add("b");
		//al.add("b");
		//al.add("c");
		//al.add("d");
		
		
		for (int i = 0; i < al.size(); i++) {
			if (al.get(i) == "b") {
				al.remove(i);
				i--;
			}
		}


在代码中，删除元素后，需要把下标减一。这是因为在每次删除元素后，ArrayList会将后面部分的元素依次往上挪一个位置（就是copy），所以，下一个需要访问的下标还是当前下标，所以必须得减一才能把所有元素都遍历完

还有另外一种方式：
		
		ArrayList<String> al = new ArrayList<String>();
		al.add("a");
		al.add("b");
		al.add("b");
		al.add("c");
		al.add("d");
		
		for (String s : al) {
			if (s.equals("a")) {
				al.remove(s);
			}
		}

此处使用元素遍历的方式，当获取到的当前元素与特定元素相同时，即删除元素。从表面上看，代码没有问题，可是运行时却报异常：
	
	Exception in thread "main" java.util.ConcurrentModificationException
			at java.util.ArrayList$Itr.checkForComodification(ArrayList.java:886)
			at java.util.ArrayList$Itr.next(ArrayList.java:836)
			at com.mine.collection.TestArrayList.main(TestArrayList.java:17)

从异常堆栈可以看出，是ArrayList的迭代器报出的异常，说明通过元素遍历集合时，实际上是使用迭代器进行访问的。可为什么会产生这个异常呢？打断点单步调试进去发现，是这行代码抛出的异常：

	final void checkForComodification() {
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
    }

modCount是集合修改的次数，当remove元素的时候就会加1，初始值为集合的大小。迭代器每次取得下一个元素的时候，都会进行判断，比较集合修改的次数和期望修改的次数是否一样，如果不一样，则抛出异常。查看集合的remove方法：

	private void fastRemove(int index) {
        modCount++;
        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index+1, elementData, index,
                             numMoved);
        elementData[--size] = null; // clear to let GC do its work
    }

可以看到，删除元素时modCount已经加一，但是expectModCount并没有增加。所以在使用迭代器遍历下一个元素的时候，会抛出异常。那怎么解决这个问题呢？其实使用迭代器自身的删除方法就没有问题了

	ArrayList<String> al = new ArrayList<String>();
	al.add("a");
	al.add("b");
	al.add("b");
	al.add("c");
	al.add("d");

	Iterator<String> iter = al.iterator();
	while (iter.hasNext()) {
		if (iter.next().equals("a")) {
			iter.remove();
		}
	}

查看迭代器自身的删除方法，果不其然，每次删除之后都会修改expectedModCount为modCount。这样的话就不会抛出异常

	public void remove() {
            if (lastRet < 0)
                throw new IllegalStateException();
            checkForComodification();

            try {
                ArrayList.this.remove(lastRet);
                cursor = lastRet;
                lastRet = -1;
                expectedModCount = modCount;
            } catch (IndexOutOfBoundsException ex) {
                throw new ConcurrentModificationException();
            }
	}

建议以后操作集合类的元素时，尽量使用迭代器。可是还有一个地方不明白，modCount和expectedModCount这两个变量究竟是干什么用的？为什么集合在进行操作时需要修改它？为什么迭代器在获取下一个元素的时候需要判断它们是否一样？它们存在总是有道理的吧

其实从异常的类型应该是能想到原因：ConcurrentModificationException.同时修改异常。看下面一个例子

	List<String> list = new ArrayList<String>();
    // Insert some sample values.
    list.add("Value1");
    list.add("Value2");
	list.add("Value3");

    // Get two iterators.

    Iterator<String> ite = list.iterator();

   	Iterator<String> ite2 = list.iterator();
	 // Point to the first object of the list and then, remove it.

    ite.next();

    ite.remove();
    /* The second iterator tries to remove the first object as well. The object does not exist and thus, a ConcurrentModificationException is thrown. */

    ite2.next();

    ite2.remove();

同样的，也会报出ConcurrentModificationException。


