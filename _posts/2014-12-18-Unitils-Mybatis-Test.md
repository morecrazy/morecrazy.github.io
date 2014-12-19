---
layout: post
title: 使用Unitils测试Mybatis持久化层
description: Unitils的目的是让单元测试变得更加容易和便于维护，其整合了各种框架，包括spring,Hibernate,Dbunit等等，模块丰富。使用Unitils+Dbunit测试Dao层，是一种不错的方法。测试Dao层的关键在于测试数据和代码的隔离，而使用Unitils+Dbunit就能很好的做到这一点
categories: 单元测试
tags: [Spring, Unitils, Mybatis]
---
## 配置 ##
- Maven工程文件pom.xml

工程环境使用Maven进行构建，持久化层使用mybatis实现domain vo到数据库的流入。使用unitils框架的第一步得导入相应的jar包。

	<dependency>
			<groupId>org.dbunit</groupId>
			<artifactId>dbunit</artifactId>
			<version>2.2.3</version>
	</dependency>
	<dependency>
			<groupId>org.unitils</groupId>
			<artifactId>unitils</artifactId>
			<version>2.4</version>
	</dependency> 

**注:** 只需要导入unitils包和dbunit包即可，unitils本身还包括一些依赖包：unitils-dbunit,unitils-database,unitils-spring等等。这些依赖包最好不要导入，导入后会覆盖unitils包下面的类，导致一些意想不到的错误

- unitils.propertis

在测试源代码的根目录下新建一个项目级别的配置文件unitils.propertis

	unitils.modules=database,dbunit
    #unitils.module.dbunit.className=sample.unitils.module.CustomExtModule
    
    #database
    #database.driverClassName=org.hsqldb.jdbcDriver
    #database.url=jdbc:hsqldb:data/sampledb;shutdown=true
    #database.dialect = hsqldb
    #database.userName=sa
    
    database.driverClassName=com.mysql.jdbc.Driver
    database.url=jdbc:mysql://localhost:3306/sampledb_test?useUnicode=true&characterEncoding=UTF-8
    database.dialect = mysql
    database.userName=root
    database.password=123456
    database.schemaNames=sampledb_test
    
    #需设置false，否则我们的测试函数只有在执行完函数体后，才将数据插入的数据表表中
    unitils.module.database.runAfter=false
    
    # The database maintainer is disabled by default.
    updateDataBaseSchema.enabled=true
    #This table is by default not created automatically
    #数据库表生成策略  
    dbMaintainer.autoCreateExecutedScriptsTable=true  
    dbMaintainer.keepRetryingAfterError.enabled=true  
    
    #测试数据库脚本目录
    dbMaintainer.script.locations=src/test/resources/dbscripts
    
    #配置数据集工厂
	DbUnitModule.DataSet.factory.default=com.morecrazy.myspring.test.dataset.excel.XlsDataSetFactory 
    DbUnitModule.ExpectedDataSet.factory.default=com.morecrazy.myspring.test.dataset.excel.XlsDataSetFactory 
    
    
    #数据集加载策略
	DbUnitModule.DataSet.loadStrategy.default=org.unitils.dbunit.datasetloadstrategy.impl.CleanInsertLoadStrategy
    DatabaseModule.Transactional.value.default=commit
    
    # XSD generator
    dataSetStructureGenerator.xsd.dirName=src/test/resources/xsd


在unitils.propertis中设置了测试要使用的数据库，数据库表的生成策略，脚本目录，数据集工厂和数据集的加载策略。可选的策略有四种：

1. CleanInsertLoadStrategy：先删除dataSet中有关数据，然后再插入
2. InsertLoadStrategy：只插入数据
3. RefreshLoadStrategy：有同样Key的数据更新，没有的插入
4. UpdateLoadStrategy：有同样key的数据更新，没有的不做操作


需要特别关注的是数据集工厂的配置。一般情况下作为测试和验证数据的载体是xml和excel两种格式，unitils需要具备访问相应格式的数据集工厂。网上讲了很多怎么根据xml数据集工厂创建一个支持访问excel的数据集工厂。代码复杂。经过验证，我发现直接实现unitils提供的DataSetFactory即可。它提供对xls格式文件的读取

	public class XlsDataSetFactory implements DataSetFactory {
	
	 private String defaultSchemaName;
	 public MultiSchemaDataSet createDataSet(File... dataSetFiles) {
		 if (dataSetFiles == null || dataSetFiles.length <= 0 || dataSetFiles[0] == null) {
			 throw new RuntimeException("xls");
		 }
		 if (!dataSetFiles[0].getName().endsWith(".xls")) {
			 throw new RuntimeException("xls");
		 }
	  
		 MultiSchemaDataSet multiSchemaDataSet = new MultiSchemaDataSet();
	  
		 IDataSet idataSet = null;
		 try {
			 idataSet = new XlsDataSet(dataSetFiles[0]);
		 } catch (DataSetException e) {
			 e.printStackTrace();
		 } catch (IOException e) {
			 e.printStackTrace();
		 }
		 multiSchemaDataSet.setDataSetForSchema(defaultSchemaName, idataSet);
		 return multiSchemaDataSet;
	 }
	 
	 public String getDataSetFileExtension() {
		 return "xls";
	 }
	 
	 public void init(Properties configuration, String defaultSchemaName) {
		 this.defaultSchemaName = defaultSchemaName;
	 }
	}

一个类文件就搞定。这也是因为之前包的导入的关系，如果除了导入unitils包之外，再导入它的一些模块包，比如：unitils-dbunit,unitils-spring之类，那么上面这种方法就行不通了。会在格式验证出抛出异常
	 
	if (!dataSetFiles[0].getName().endsWith(".xls")) {
			 throw new RuntimeException("xls");
	}

不知道这是一个投机取巧的办法还是unitils的bug，但是用这种方式确实方便很多。我没有试过高版本的unitils的DataSetFactory支不支持xls，如果发现不支持，那么还是老老实实的构造一个支持xls的数据集工厂。至于怎么弄，我会在下一篇文章中分析，此处篇幅有限，就使用这种省事但效果一样的办法。

## 测试代码 ##

配置完成后，就可以针对相应的dao进行测试。此处我采用mybatis作为持久层的实现。mybatis相对hibernate更灵活，能自己控制sql语句，并且层次清晰，掌握起来容易。只需要写好相应的dao接口，配置好映射文件即可。

关于unitils测试hibernate持久层的方法，网上很多，也比较全。unitils也很好的支持hibernate。有相应的模块。上网找了一遍，并没有发现unitils支持mybatis的框架，不过没有关系，用自己的方法，取其好的地方，达到目的即可。

先贴一段测试代码

    public class UserDaoTest extends BaseDaoTest{
	
	private static ApplicationContext ctx;
	
	private UserDao userDao;
	
	
	@BeforeClass
	public static void setUpBeforeClass() {
		ctx = new ClassPathXmlApplicationContext("classpath:applicationContext-mybatis.xml");
	}
	@Before
	public void setUp() {
		userDao = (UserDao) ctx.getBean("userDao");
	}
	
	@Test
	@DataSet("Users.xls")//准备数据 
	public void findUserByUserName() {
		if (userDao == null) { System.out.println("ok");}
		User user = userDao.getUserByUserName("jhon");

		assertNull("不存在用户名为tony的用户!", user);
		user = userDao.getUserByUserName("jan");
		assertNotNull(user);
		assertEquals("jan",user.getUserName());
		
	}

	
	// 验证数据库保存的正确性
	@Test
	@ExpectedDataSet("ExpectedSaveUser.xls")// 准备验证数据
	public void saveUser()throws Exception  {
		/**
		硬编码创建测试实体
		User u = new User();
		u.setUserId(1);
		u.setUserName("tom");
		u.setPassword("123456");
		u.setLastVisit(getDate("2011-06-06 08:00:00","yyyy-MM-dd HH:mm:ss"));
		u.setCredits(30);
		u.setLastIp("127.0.0.1");
		**/
		//通过XlsDataSetBeanFactory数据集绑定工厂创建测试实体
		User u  = XlsDataSetBeanFactory.createBean(UserDaoTest.class,"BaobaoTao.SaveUser.xls", "t_user", User.class);
		userDao.save(u);  //执行用户信息更新操作
	}
	
	//验证数据库保存的正确性
	@Test
	@ExpectedDataSet("ExpectedSaveUsers.xls")// 准备验证数据
	public void saveUsers()throws Exception  {
		List<User> users  = XlsDataSetBeanFactory.createBeans(UserDaoTest.class,"BaobaoTao.SaveUsers.xls", "t_user", User.class);
		for(User u:users){
		     userDao.save(u);
		}
	}
	}

父类：BaseDaoTest

    @RunWith(UnitilsJUnit4TestClassRunner.class)
    @DataSet("BaseDao.xls")
    public class BaseDaoTest {
    	
    }


unitils整合了junit框架，加上@RunWith(UnitilsJUnit4TestClassRunner.class)注解后即可使用unitils整合junit后的相关功能，比如@Test,@Before,@DataSet等注解的使用。

@DataSet:加载相应的数据集文件，这里使用xls格式：

![加载数据集] (/assets/images/2014/unitils-mybatis-01.png)

excel文件中的每一列和数据库中的表相对应，下面sheet单的名字对应了数据库里相应的table

根据配置的数据加载策略，每次@Test的时候，都是先clean掉数据库里的数据，然后再将excel中的数据插入。

@ExpectedDataSet:验证数据，不会加载到数据库里。只要满足期望的数据在数据库里，测试用例就能通过，而并不需要满足数据里的数据都能在期望excel表中查到。这点是需要注意的。

![加载数据集] (/assets/images/2014/unitils-mybatis-03.png)

还有一点需要**注意**:使用@ExpectedDataSet注解进行数据验证时，并不会使用配置的数据加载策略，比如CleanInserty之类。所以对于有主键的数据插入，很容易出现冲突，解决办法有两个：

1. 进行数据的验证时，不插入带有主键的数据。
2. 使用注解的方式强制每次操作时，都清空相应的表，比如：


	    @DataSet("BaseDao.xls")
    	public class BaseDaoTest {
    	
    	}

BaseDao.xls的作用就是清空数据，里面除了保护table名和column，没有数据

![清空数据] (/assets/images/2014/unitils-mybatis-04.png)


此处为了使用useDao这个spring bean，采用的是以代码的方式，加载配置文件applicationContext-mybatis.xml获取springContext中的bean。

	<context:component-scan base-package="com.morecrazy.myspring.dao.mybatis" />
	<context:component-scan base-package="com.morecrazy.myspring.service" />    
	<context:property-placeholder location="classpath:jdbc.properties" />
	
    <!-- 使用unitils提供的数据源 -->
	<bean id="dataSource" class="org.unitils.database.UnitilsDataSourceFactoryBean"/>
	
	  
	<!-- <bean id="dataSource" 
	    class="org.apache.commons.dbcp.BasicDataSource"
		destroy-method="close" 
		p:driverClassName="${jdbc.driverClassName}"
		p:url="${jdbc.url}"
		p:username="${jdbc.username}"
		p:password="${jdbc.password}" /> -->
    
	<bean id="sqlSessionFactory" 
	  class="org.mybatis.spring.SqlSessionFactoryBean"
	  p:dataSource-ref="dataSource"
	  p:configLocation="classpath:myBatisConfig.xml"
	  p:mapperLocations="classpath:com/morecrazy/myspring/domain/mybatis/*.xml"/>
	
   	<bean class="org.mybatis.spring.SqlSessionTemplate">
      <constructor-arg ref="sqlSessionFactory"/>
   	</bean> 
	  
    <bean class="org.mybatis.spring.mapper.MapperScannerConfigurer"
          p:sqlSessionFactoryBeanName="sqlSessionFactory"
          p:basePackage="com.morecrazy.myspring.dao.mybatis"/>
     
     <bean id="transactionManager" 
         class="org.springframework.jdbc.datasource.DataSourceTransactionManager"
         p:dataSource-ref="dataSource"/>
         
     <tx:annotation-driven transaction-manager="transactionManager"/>     

配置文件里，修改了一处：dataSource，使用unitils配置文件中的数据源。但这样做其实不太好，因为为了不影响到实际的数据库，我们必须得在test资源目录下新建一个mybatis的配置文件。其实这也是没有办法的办法。如果不以代码的方式载入配置文件，而使用通用的注解方式，是不能能获取到持久层的bean，会报null exception。

	@RunWith(UnitilsJUnit4TestClassRunner.class)
	@SpringApplicationContext({"classpath:applicationContext-mybatis.xml"})
	public class UserDaoTest {
	
		private static ApplicationContext ctx;
	
		@SpringBean("userDao")
		private UserDao userDao;
	}

此处的userDao是获取不到的。但如果持久层是用其他方式实现的，比如Spring Jdbc或者hibernate。这样处理是最好的。所以为了测试mybatis实现的持久化层，暂时只能想到上面用代码硬加载的方式。

最后验证数据没问题了，跑一下程序：

![测试结果] (/assets/images/2014/unitils-mybatis-02.png)