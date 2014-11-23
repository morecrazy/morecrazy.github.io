jQuery.noConflict();
jQuery(document).ready(function(){
	jQuery("#toTop").hide(); 
	
	jQuery( "#toTop a:first").click( function () {
        	jQuery( "html,body").animate({ "scrollTop" : 0 }, 200);
        });
	
	var windowHeight = parseInt(jQuery("body").css("height" ));
		jQuery( "#toTop a:last").click(function () {
		jQuery( "html,body").animate({ "scrollTop" : windowHeight }, 200);
	});

	jQuery(window).scroll(function() {
		jQuery(this).scrollTop() > 200 ? jQuery("#toTop").fadeIn() : jQuery("#toTop").fadeOut()
	});
	
	//jQuery('.content div.col-md-9 a').attr('target', '_blank');

 	jQuery("p img").each(function() {
		var strA = "<a id='fancyBox' href='" + this.src + "'></a>";
		jQuery(this).wrapAll(strA);
        });

	jQuery("#fancyBox").fancybox({
	      openEffect	: 'elastic',
	      closeEffect	: 'elastic',
	    });

   
});



