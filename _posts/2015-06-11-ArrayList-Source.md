---
layout: post
title: Java ArrayList源码剖析
description: 结合源码，分析ArrayList类中一些方法的实现，并指出需要注意的地方
categories: Java Collection
tags: [ArrayList, Collection]
---

##ArrayList 简介##









- ArrayList是最常用的一种java集合，底层是基于数组实现的，能够动态扩容





- ArrayList不是线程安全的，只能用在单线程环境下，多线程环境下可以考虑使用Collections.synchronizedList(List l)函数返回一个线程安全的ArrayList类，也可以使用concurrent并发包下的CopyOnWriteArrayList类。





- ArrayList实现了Serializable接口，因此它支持序列化，能够通过序列化传输，实现了RandomAccess接口，支持快速随机访问，实际上就是通过下标序号进行快速访问，实现了Cloneable接口，能被克隆。

##ArrayList源码剖析##
使用注解的方式进行源码剖析

	public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable
	{
		//序列版本号，可以序列化传输
    	private static final long serialVersionUID = 8683452581122892189L;
		
		//初始容量为10
		private static final int DEFAULT_CAPACITY = 10;
		
		//空的Array，可以存储任意Object
		private static final Object[] EMPTY_ELEMENTDATA = {};

		//该数组用于保存数据
		transient Object[] elementData; 
		
		//包含的元素个数，区别于容量
		private int size;

		//带容量的构造函数
		public ArrayList(int initialCapacity) {
        	super();
        	if (initialCapacity < 0)
            	throw new IllegalArgumentException("Illegal Capacity: "+
                                               	initialCapacity);
        	this.elementData = new Object[initialCapacity];
    	}

		//无参数的构造函数，进行初始化的时候，使用空的Array作为底层的数据结构
		public ArrayList() {
        	super();
       	    this.elementData = EMPTY_ELEMENTDATA;
        }

		
		//创建一个包含collection的ArrayList
		public ArrayList(Collection<? extends E> c) {
        	elementData = c.toArray();
        	size = elementData.length;
        	// c.toArray might (incorrectly) not return Object[] (see 6260652)
        	if (elementData.getClass() != Object[].class)
            	elementData = Arrays.copyOf(elementData, size, Object[].class);
    	}
		
		//将容量截取到实际存储的元素的大小
		public void trimToSize() {
        	modCount++;
        	if (size < elementData.length) {
				//将原来的数据拷贝一份，并重新申请空间
            	elementData = Arrays.copyOf(elementData, size);
        	}
    	}

		//内部扩容
		private void ensureCapacityInternal(int minCapacity) {
        	if (elementData == EMPTY_ELEMENTDATA) {
            	minCapacity = Math.max(DEFAULT_CAPACITY, minCapacity);
        	}

        	ensureExplicitCapacity(minCapacity);
    	}

   		private void ensureExplicitCapacity(int minCapacity) {
			//修改次数加一
        	modCount++;

        	//如果最小容量已经大小元素数组的长度，则进行扩容
        	if (minCapacity - elementData.length > 0)
            	grow(minCapacity);
    	}
		
		//进行扩容
		private void grow(int minCapacity) {
        	// overflow-conscious code
        	int oldCapacity = elementData.length;
			//新容量为原容量的1.5倍
        	int newCapacity = oldCapacity + (oldCapacity >> 1);
			//如果新容量还是小于最小容量需求，则直接使用最小的容量
        	if (newCapacity - minCapacity < 0)
            	newCapacity = minCapacity;
        	if (newCapacity - MAX_ARRAY_SIZE > 0)
            	newCapacity = hugeCapacity(minCapacity);
        	// minCapacity is usually close to size, so this is a win:
        	elementData = Arrays.copyOf(elementData, newCapacity);
        }

		
		//判断是否包含某个元素
		public boolean contains(Object o) {
        	return indexOf(o) >= 0;
    	}

		//遍历数组，返回元素的index，不存在则返回-1.
		public int indexOf(Object o) {
			//数组支持null
        	if (o == null) {
            	for (int i = 0; i < size; i++)
                	if (elementData[i]==null)
                   		return i;
        	} else {
            	for (int i = 0; i < size; i++)
                	if (o.equals(elementData[i]))
                    	return i;
        	}
        	return -1;
    	}


		//浅拷贝，只是拷贝了数组元素，但是元素本身并没有拷贝
		public Object clone() {
        	try {
            	ArrayList<?> v = (ArrayList<?>) super.clone();
            	v.elementData = Arrays.copyOf(elementData, size);
            	v.modCount = 0;
            	return v;
        	} catch (CloneNotSupportedException e) {
            	// this shouldn't happen, since we are Cloneable
            	throw new InternalError(e);
        	}
       }

		
		//返回ArrayList的Object数组
	    public Object[] toArray() {
        	return Arrays.copyOf(elementData, size);
    	}

		
		//将ArrayList中的元素拷贝到数组a中
		public <T> T[] toArray(T[] a) {
        	if (a.length < size)
            	//如果数组a长度小于ArrayList中的元素个数，则新创建一个数组使其能容纳所有元素
            	return (T[]) Arrays.copyOf(elementData, size, a.getClass());
			//如果数组a长度大于ArrayList中的元素个数，则直接将ArrayList中的全部元素拷贝到数组a中
        	System.arraycopy(elementData, 0, a, 0, size);
        	if (a.length > size)
            	a[size] = null;
       	 	return a;
   		}


		//根据下标返回元素
		E elementData(int index) {
        	return (E) elementData[index];
    	}

		//返回List中特定位置的元素
		public E get(int index) {
			//检查下标是否越界，如果越界会抛出异常
        	rangeCheck(index);

        	return elementData(index);
    	}

		//向List中特定位置插入元素
		public E set(int index, E element) {
			//检查下标是否越界
        	rangeCheck(index);

        	E oldValue = elementData(index);
        	elementData[index] = element;
        	return oldValue;
    	}

		//添加元素e
		public boolean add(E e) {
			//每次添加的时候，都会进行是否进行扩容的判断，当前需要的最小容量已经变为size+1，如果需要的最小容量已经大于当前数组elementData的长度，则进行扩容
        	ensureCapacityInternal(size + 1);  // Increments modCount!!
        	elementData[size++] = e;
        	return true;
    	}

		//在特定位置添加元素e，将当前位置的元素依次向右移动（copy)
		public void add(int index, E element) {
			//检查下标是否越界
        	rangeCheckForAdd(index);
			
			//进行扩容判断
        	ensureCapacityInternal(size + 1);  // Increments modCount!!
        	System.arraycopy(elementData, index, elementData, index + 1,
                         	size - index);
        	elementData[index] = element;
        	size++;
    	}

		
		//删除特定位置的元素，将后面的元素依次向左移动一位
		public E remove(int index) {
        	rangeCheck(index);

        	modCount++;
        	E oldValue = elementData(index);

        	int numMoved = size - index - 1;
        	if (numMoved > 0)
            	System.arraycopy(elementData, index+1, elementData, index,
                             	numMoved);
			//元素个数减一
        	elementData[--size] = null; // clear to let GC do its work

        	return oldValue;
    	}

		//快速删除，没有越界检查，也不会返回删除的元素
		private void fastRemove(int index) {
        	modCount++;
        	int numMoved = size - index - 1;
        	if (numMoved > 0)
            	System.arraycopy(elementData, index+1, elementData, index,
                             numMoved);
        	elementData[--size] = null; // clear to let GC do its work
    	}

		
		public Iterator<E> iterator() {
        	return new Itr();
    	}


##几点值得注意的地方##


1. 注意其三个不同的构造方法。无参构造方法构造的ArrayList的容量默认为10，

2. 注意扩充容量的方法ensureCapacity。ArrayList在每次增加元素（可能是1个，也可能是一组）时，都要调用该方法来确保足够的容量。当容量不足以容纳当前的元素个数时，就设置新的容量为旧的容量的1.5倍加1，如果设置后的新容量还不够，则直接新容量设置为传入的参数（也就是所需的容量），而后用Arrays.copyof()方法将元素拷贝到新的数组（详见下面的第3点）。从中可以看出，当容量不够时，每次增加元素，都要将原来的元素拷贝到一个新的数组中，非常之耗时，也因此建议在事先能确定元素数量的情况下，才使用ArrayList，否则建议使用LinkedList。

3. ArrayList的实现中大量地调用了Arrays.copyof()和System.arraycopy()方法，Arrays.copyof()实际上调用的是底层的System.arraycopy()方法。下面来看System.arraycopy()方法。该方法被标记了native，调用了系统的C/C++代码，在JDK中是看不到的，但在openJDK中可以看到其源码。该函数实际上最终调用了C语言的memmove()函数，因此它可以保证同一个数组内元素的正确复制和移动，比一般的复制方法的实现效率要高很多，很适合用来批量处理数组。Java强烈推荐在复制大量数组元素时用该方法，以取得更高的效率。


4. 注意ArrayList的两个转化为静态数组的toArray方法。

 	第一个，Object[] toArray()方法。该方法有可能会抛出java.lang.ClassCastException异常，如果直接用向下转型的方法，将整个ArrayList集合转变为指定类型的Array数组，便会抛出该异常，而如果转化为Array数组时不向下转型，而是将每个元素向下转型，则不会抛出该异常，显然对数组中的元素一个个进行向下转型，效率不高，且不太方便。

	第二个，<T> T[] toArray(T[] a)方法。该方法可以直接将ArrayList转换得到的Array进行整体向下转型（转型其实是在该方法的源码中实现的），且从该方法的源码中可以看出，参数a的大小不足时，内部会调用Arrays.copyOf方法，该方法内部创建一个新的数组返回，因此对该方法的常用形式如下：		
	
		public static Integer[] vectorToArray2(ArrayList<Integer> v) {  
			Integer[] newText = (Integer[])v.toArray(new Integer[0]);  
			return newText;  
		}  








1. ArrayList基于数组实现，可以通过下标索引直接查找到指定位置的元素，因此查找效率高，但每次插入或删除元素，就要大量地移动元素，插入删除元素的效率低。



1. 在查找给定元素索引值等的方法中，源码都将该元素的值分为null和不为null两种情况处理，ArrayList中允许元素为null。












		



