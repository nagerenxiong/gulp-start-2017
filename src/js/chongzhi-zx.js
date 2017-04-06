
(function($){
  var methods = {

    init: function(options) {
      return this.each(function(){
        var $this = $(this),
            data = $this.data('eraser');

        if (!data) {

          var handleImage = function() {
            var $canvas = $('<canvas/>'),
                canvas = $canvas.get(0),
                ctx = canvas.getContext('2d'),

                // calculate scale ratio for high DPI devices
                // http://www.html5rocks.com/en/tutorials/canvas/hidpi/
                devicePixelRatio = window.devicePixelRatio || 1,
                backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                    ctx.mozBackingStorePixelRatio ||
                    ctx.msBackingStorePixelRatio ||
                    ctx.oBackingStorePixelRatio ||
                    ctx.backingStorePixelRatio || 1,
                scaleRatio = devicePixelRatio / backingStoreRatio,

                realWidth = $this.width(),
                realHeight = $this.height(),
                width = realWidth * scaleRatio,
                height = realHeight * scaleRatio,
                pos = $this.offset(),
                enabled = (options && options.enabled === false) ? false : true,
                size = ((options && options.size) ? options.size : 40) * scaleRatio,
                completeRatio = (options && options.completeRatio) ? options.completeRatio : .7,
                completeFunction = (options && options.completeFunction) ? options.completeFunction : null,
                progressFunction = (options && options.progressFunction) ? options.progressFunction : null,
                zIndex = $this.css('z-index') == "auto"?1:$this.css('z-index'),
                parts = [],
                colParts = Math.floor(width / size),
                numParts = colParts * Math.floor(height / size),
                n = numParts,
                that = $this[0];

            // replace target with canvas
            $this.after($canvas);
            canvas.id = that.id;
            canvas.className = that.className;
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = realWidth.toString() + "px";
            canvas.style.height = realHeight.toString() + "px";
            ctx.drawImage(that, 0, 0, width, height);
            $this.remove();

            // prepare context for drawing operations
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(255,0,0,255)';
            ctx.lineWidth = size;

            ctx.lineCap = 'round';
            // bind events
            $canvas.bind('mousedown.eraser', methods.mouseDown);
            $canvas.bind('touchstart.eraser', methods.touchStart);
            $canvas.bind('touchmove.eraser', methods.touchMove);
            $canvas.bind('touchend.eraser', methods.touchEnd);

            // reset parts
            while(n--) parts.push(1);

            // store values
            data = {
              posX: pos.left,
              posY: pos.top,
              touchDown: false,
              touchID: -999,
              touchX: 0,
              touchY: 0,
              ptouchX: 0,
              ptouchY: 0,
              canvas: $canvas,
              ctx: ctx,
              w: width,
              h: height,
              scaleRatio: scaleRatio,
              source: that,
              size: size,
              parts: parts,
              colParts: colParts,
              numParts: numParts,
              ratio: 0,
              enabled: enabled,
              complete: false,
              completeRatio: completeRatio,
              completeFunction: completeFunction,
              progressFunction: progressFunction,
              zIndex: zIndex
            };
            $canvas.data('eraser', data);

            // listen for resize event to update offset values
            $(window).resize(function() {
              var pos = $canvas.offset();
              data.posX = pos.left;
              data.posY = pos.top;
            });
          }

          if (this.complete && this.naturalWidth > 0) {
            handleImage();
          } else {
            //this.onload = handleImage;
            $this.on('load', handleImage);
          }
        }
      });
    },

    touchStart: function(event) {
      var $this = $(this),
          data = $this.data('eraser');

      if (!data.touchDown) {
        var t = event.originalEvent.changedTouches[0],
            tx = t.pageX - data.posX,
            ty = t.pageY - data.posY;
        tx *= data.scaleRatio;
        ty *= data.scaleRatio;

        if (data.enabled) {
          methods.evaluatePoint(data, tx, ty);
        }

        data.touchDown = true;
        data.touchID = t.identifier;
        data.touchX = tx;
        data.touchY = ty;
        event.preventDefault();
      }
    },

    touchMove: function(event) {
      var $this = $(this),
          data = $this.data('eraser');

      if (data.touchDown) {
        var ta = event.originalEvent.changedTouches,
            n = ta.length;
        while (n--) {
          if (ta[n].identifier == data.touchID) {
            var tx = ta[n].pageX - data.posX,
                ty = ta[n].pageY - data.posY;
            tx *= data.scaleRatio;
            ty *= data.scaleRatio;

            if (data.enabled) {
              methods.evaluatePoint(data, tx, ty);
              data.ctx.beginPath();
              data.ctx.moveTo(data.touchX, data.touchY);
              data.ctx.lineTo(tx, ty);
              data.ctx.stroke();
              $this.css({"z-index":$this.css('z-index')==data.zIndex?parseInt(data.zIndex)+1:data.zIndex});
            }

            data.touchX = tx;
            data.touchY = ty;

            event.preventDefault();
            break;
          }
        }
      }
    },

    touchEnd: function(event) {
      var $this = $(this),
        data = $this.data('eraser');

      if ( data.touchDown ) {
        var ta = event.originalEvent.changedTouches,
          n = ta.length;
        while( n-- ) {
          if ( ta[n].identifier == data.touchID ) {
            data.touchDown = false;
            event.preventDefault();
            break;
          }
        }
      }
    },

    evaluatePoint: function(data, tx, ty) {
      if (!data.enabled) return;
      var p = Math.floor(tx/data.size) + Math.floor( ty / data.size ) * data.colParts;

      if ( p >= 0 && p < data.numParts ) {
        data.ratio += data.parts[p];
        data.parts[p] = 0;
        if (!data.complete) {
          p = data.ratio/data.numParts;
          if ( p >= data.completeRatio ) {
            data.complete = true;
            if ( data.completeFunction != null ) data.completeFunction();
          } else {
            if ( data.progressFunction != null ) data.progressFunction(p);
          }
        }
      }

    },

    mouseDown: function(event) {
      var $this = $(this),
          data = $this.data('eraser'),
          tx = event.pageX - data.posX,
          ty = event.pageY - data.posY;
      tx *= data.scaleRatio;
      ty *= data.scaleRatio;

      data.touchDown = true;
      data.touchX = tx;
      data.touchY = ty;

      if (data.enabled) {
        methods.evaluatePoint( data, tx, ty );

        data.ctx.beginPath();
        data.ctx.moveTo(data.touchX-1, data.touchY);
        data.ctx.lineTo(data.touchX, data.touchY);
        data.ctx.stroke();
      }

      $this.bind('mousemove.eraser', methods.mouseMove);
      $(document).bind('mouseup.eraser', data, methods.mouseUp);
      event.preventDefault();
    },

    mouseMove: function(event) {
      var $this = $(this),
          data = $this.data('eraser'),
          tx = event.pageX - data.posX,
          ty = event.pageY - data.posY;
      tx *= data.scaleRatio;
      ty *= data.scaleRatio;

      if (data.enabled) {
        methods.evaluatePoint( data, tx, ty );
        data.ctx.beginPath();
        data.ctx.moveTo( data.touchX, data.touchY );
        data.ctx.lineTo( tx, ty );
        data.ctx.stroke();
        $this.css({"z-index":$this.css('z-index')==data.zIndex?parseInt(data.zIndex)+1:data.zIndex});
      }

      data.touchX = tx;
      data.touchY = ty;

      event.preventDefault();
    },

    mouseUp: function(event) {
      var data = event.data,
          $this = data.canvas;

      data.touchDown = false;
      $this.unbind('mousemove.eraser');
      $(document).unbind('mouseup.eraser');
      event.preventDefault();
    },

    clear: function() {
      var $this = $(this),
          data = $this.data('eraser');

      if (data) {
        data.ctx.clearRect(0, 0, data.w, data.h);
        var n = data.numParts;
        while(n--) data.parts[n] = 0;
        data.ratio = data.numParts;
        data.complete = true;
        if (data.completeFunction != null) data.completeFunction();
      }
    },

    enabled: function() {
      var $this = $(this),
          data = $this.data('eraser');

      if (data && data.enabled) {
        return true;
      }
      return false;
    },

    enable: function() {
      var $this = $(this),
          data = $this.data('eraser');

      if (data) {
        data.enabled = true;
      }
    },

    disable: function() {
      var $this = $(this),
          data = $this.data('eraser');

      if (data) {
        data.enabled = false;
      }
    },

    size: function(value) {
      var $this = $(this),
          data = $this.data('eraser');

      if (data && value) {
        data.size = value;
        data.ctx.lineWidth = value;
      }
    },

    reset: function() {
      var $this = $(this),
          data = $this.data('eraser');

      if (data) {
        data.ctx.globalCompositeOperation = 'source-over';
        data.ctx.drawImage( data.source, 0, 0, data.w, data.h);
        data.ctx.globalCompositeOperation = 'destination-out';
        var n = data.numParts;
        while (n--) data.parts[n] = 1;
        data.ratio = 0;
        data.complete = false;
        data.touchDown = false;
      }
    },

    progress: function() {
      var $this = $(this),
          data = $this.data('eraser');

      if (data) {
        return data.ratio/data.numParts;
      }
      return 0;
    }

  };

  $.fn.eraser = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || ! method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' +  method + ' does not yet exist on jQuery.eraser');
    }
  };
})(jQuery);


//公共通用部分

// JavaScript Document
$(document).ready(function(){
  $(".spcs").click(function(){
    $(".model-bg").animate({left:'0px'});
    $(".xzcs").animate({right:'0px'});
    $("body").addClass("open");
  });
  $(".model-bg").click(function(){
    $(".model-bg").animate({left:'100%'});
    $(".xzcs").animate({right:'-100%'});
    $("body").removeClass("open");
  });
  $(".ljgm").click(function(){
    $(".model-bg").animate({left:'0px'});
    $(".xzcs2").animate({left:'0px'});
    $("body").addClass("open");
  });
  $(".xzcs2").click(function(){
    $(".model-bg").animate({left:'100%'});
    $(".xzcs2").animate({left:'100%'});
    $("body").removeClass("open");
  });
  $(".icon-text-list.more").click(function(){
    $(".main-more").slideToggle('fast');
  });
  $(".ewm").click(function(){
    $(".model-bg2").toggle();
    $(".ewm-box").toggle();
  });
  $(".model-bg2").click(function(){
    $(".model-bg2").hide();
    $(".tcbox").hide();
    $(".fx-box").slideUp('fast');
  });
   $(".model-bg2").click(function(){
    $(".ewm-box").hide(); 
  });
  $(".fx").click(function(){
    $(".model-bg2").toggle();
    $(".main-more").hide('fast');
    $(".fx-box").slideDown('fast');
  });
  $(".model-bg2").click(function(){
    $(".model-bg2").hide();
    $(".tcbox").hide();
    $(".fx-box").slideUp('fast');
  });
  $(".cancel").click(function(){
    $(".model-bg2").hide();
    $(".fx-box").slideUp('fast');
  });
  $(".qr").click(function(){
    $(".model-bg2").show();
    $(".tcbox").show();
  });
  $(".wxts").click(function(){
    $(".model-bg2").toggle();
    $(".qrhy_wxtsmm").slideDown('fast');
  });
  $(".model-bg2").click(function(){
    $(".model-bg2").hide();
    $(".qrhy_wxtsmm").slideUp('fast');
	//$(".qrhy_wxtsmm").hide();
  });
  $(".qrhy-text .close").click(function(){
    $(".model-bg2").hide();
    $(".qrhy_wxtsmm").slideUp('fast');
	//$(".qrhy_wxtsmm").hide();
  });
  $(".sx").click(function(){
    $(".model-bg").animate({left:'0px'});
    $(".sx-main").animate({left:'50%'});
    $("body").addClass("open");
  });
  $(".model-bg").click(function(){
    $(".model-bg").animate({left:'100%'});
    $(".sx-main").animate({left:'100%'});
    $("body").removeClass("open");
  });
  $(".close-ex").click(function(){
    $(".model-bg2").toggle();
    $(".ewm-box").toggle();
  });
$(".sum").click(function(){
    $(".share-sum").slideDown('fast');
    $(".more-box").addClass("on");
  });
  $(".more-box").click(function(){
    $(".sum-box").slideUp('fast');
    $(".more-box").removeClass("on");
  });
  $(".cancel").click(function(){
    $(".sum-box").slideUp('fast');
    $(".more-box").removeClass("on");
  });
  $(".sp-sc.active").click(function(){
    $(".share-box").slideDown('fast');
    $(".more-box").addClass("on");
  });
  

  
});

//分享
$(document).ready(function(){
  $(".share").click(function(){
    $(".share-box").slideDown('fast');
    $(".nav-slide").slideUp('fast');
    $(".more-box").addClass("on");
  });
  $(".more-box").click(function(){
	$(".nav-slide").slideUp('fast');
    $(".share-box").slideUp('fast');
    $(".more-box").removeClass("on");
  });
  $(".cancel").click(function(){
    $(".share-box").slideUp('fast');
    $(".more-box").removeClass("on");
  });
  $(".yhq").click(function(){
    $(".yhq-box").show(300).delay(1800).hide(300);
  });
   $(".close_srch").click(function(){
    $("body").removeClass("hide-landing");
	$(".tip-search").removeClass("on-focus");
  });
   $(".srch-input .tip-search-input").click(function(){
    $("body").addClass("hide-landing");
	$(".tip-search").addClass("on-focus");
  });
   $(".boxes .box").click(function(){
    $(".boxes .box").removeClass("curr ");
	$(this).addClass("curr");
  });
   $(".px-list li").click(function(){
    $(".px-list li").removeClass("active ");
	$(this).addClass("active");
  });
  
  

  $("#top").click(function(){ //当点击标签的时候,使用animate在200毫秒的时间内,滚到顶部
	 $("html,body").animate({scrollTop:"0px"},200);
	 $('#scroller').css("transform","translate(0px,-40px)");
	 $('#scroller').css("-ms-transform","translate(0px,-40px)");
	 $('#scroller').css("-moz-transform","translate(0px,-40px)");
	 $('#scroller').css("-webkit-transform","translate(0px,-40px)");
	 $('#scroller').css("transition",".5s");
	 $('#scroller').css("-moz-transition",".5s");
	 $('#scroller').css("-webkit-transition",".5s");
	 $('#scroller').css("-o-transition",".5s");
	  setTimeout(function () { 
      $('#scroller').css("transition","");
	   $('#scroller').css("-moz-transition","");
	    $('#scroller').css("-webkit-transition","");
		 $('#scroller').css("-o-transition","");
		 $("#top").show(); 
    }, 500);
	 
  });
});

//返回顶部
$(window).scroll(function(){  //只要窗口滚动,就触发下面代码 
	var scrollt = document.documentElement.scrollTop + document.body.scrollTop; //获取滚动后的高度 
	if( scrollt >70 ){  //判断滚动后高度超过200px,就显示  
		$("#top").fadeIn(400); //淡出     
	}else{      
		$("#top").stop().fadeOut(400); //如果返回或者没有超过,就淡入.必须加上stop()停止之前动画,否则会出现闪动   
	}
});

function renameImageSize(path,size){
    try {
        var  lastIndex = path.lastIndexOf(".");
        if(lastIndex>0) {
            // 获得文件后缀名
            var tmpName = path.substring(lastIndex,path.length);
            var tmpPath = path.substring(0, lastIndex);
            path = tmpPath + "_" + size + tmpName;
        }
    }catch (e){}
    return path;
}
//控制rem单位
(function (doc, win) {
          var docEl = doc.documentElement,
            resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
            recalc = function () {
              var b = docEl.clientWidth;
              if (!b) return;
			      b= b>=640?640 : b;
			 var arem=b/16;
              docEl.style.fontSize =arem+ 'px';
            };

          if (!doc.addEventListener) return;
          win.addEventListener(resizeEvt, recalc, false);
          doc.addEventListener('DOMContentLoaded', recalc, false);
        })(document, window);
		//页面加载完以后
	document.onreadystatechange = subSomething;
	function subSomething(){
		if(document.readyState == "complete"){
			$(".u-Loading").hide(function(){
				$("#join-hui-content").removeClass('hide');
			});
		}
	}
 
// JavaScript Document
$(document).ready(function(){
  $(".icon-right").click(function(){
    $(".top .nav-slide").slideToggle(20);
    $(".center-top .nav-slide").slideToggle(20);
	 $(".tip-search .nav-slide").hide();
    $(".modal-bg").toggle();
  });
   $(".srch_up").click(function(){
    $(".tip-search .nav-slide").slideToggle(20);
    $(".modal-bg").toggle();
  });
  $(".modal-bg").click(function(){
    $(".top .nav-slide").slideUp(20);
    $(".center-top .nav-slide").slideUp(20);
    $(".modal-bg").hide();
  });
  $(".nav-arrow").click(function(){
    $(".top .nav-slide").slideUp(20);
    $(".center-top .nav-slide").slideUp(20);
    $(".modal-bg").hide();
  });
  $("#prices").click(function(){
    $(".site-search").slideToggle(20);
	$(".droplist").removeClass("droplist-expand");
	$(".droplist ul li").removeClass("selected");
	$("#prices .show-up").toggleClass("show-down");
	$("#zhpx .show-up").removeClass("show-down");
  });
  $("#zhpx").click(function(){
    $(".droplist").toggleClass("droplist-expand");
	$("#zhpx .show-up").toggleClass("show-down");
	 $(".site-search").hide();
	 $("#prices .show-up").removeClass("show-down");
  });
   $("#xlyx").click(function(){
	   $("#xlyx .show-up").toggleClass("show-down");
    $(".droplist").removeClass("droplist-expand");
	$(".droplist ul li").removeClass("selected");
	$("#zhpx .show-up").removeClass("show-down");
	 $(".site-search").hide();
	 $("#prices .show-up").removeClass("show-down");
  });
 
  
  
  
  $(".droplist li").click(function(){
    $(".droplist li").removeClass("selected");
	 $(this).addClass("selected");
	  $(".droplist").removeClass("droplist-expand");
  });
  
   $(".bt-list li").click(function(){
    $(".bt-list li").removeClass("active");
	 $(this).addClass("active");
  });
  
  
  $(".jg-search .hot-list a").click(function(){
    $(".jg-search .hot-list a").removeClass("on");
	 $(this).addClass("on");
	 $(".site-search").hide();
  });
  
   $(".clear-text").click(function(){
    $(".input-box .cz-input").val("");
	 $("#userCity").html("");
	 $("#userName").html("");
	 $("#quickPayFee").attr("disabled","disabled").attr("class" ,"btn btn-block");
	 $(".clear-text").hide();
	 $("#errorPhone").hide();
	 canBuyForPhone = false;
  });
   $(".input-box .cz-input").click(function(){
     $(".clear-text").show();
  });
  
   $(".cz-text #czsm").click(function(){
     $(".cz-text-main").toggle();
  });
  
  
  
});

$(function(){  
     $(":input").focus(function(){  
      $(".topIphone.affix").removeClass("affix");  
     }).blur(function(){  
       $(".topIphone").addClass("affix");  
   });  
});
window.alert = function (msg) {
  $('body').append('<div>' + msg + '</div>')
};
function fixedWatch(el) {
  if(document.activeElement.nodeName == 'input'){
    el.css('position', 'static');
  } else {
    el.css('position', 'fixed');
  }
}

 