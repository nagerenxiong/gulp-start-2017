    $(".scrolltop").click(function() {
        $("html,body").animate({
            scrollTop: "0px"
        }, 200);
        $("#scroller").css("transform", "translate(0px,-40px)");
        $("#scroller").css("-ms-transform", "translate(0px,-40px)");
        $("#scroller").css("-moz-transform", "translate(0px,-40px)");
        $("#scroller").css("-webkit-transform", "translate(0px,-40px)");
        $("#scroller").css("transition", ".5s");
        $("#scroller").css("-moz-transition", ".5s");
        $("#scroller").css("-webkit-transition", ".5s");
        $("#scroller").css("-o-transition", ".5s");
        setTimeout(function() {
            $("#scroller").css("transition", "");
            $("#scroller").css("-moz-transition", "");
            $("#scroller").css("-webkit-transition", "");
            $("#scroller").css("-o-transition", "");
             $(".scrolltop").show()
        }, 500)
    });
    $(window).scroll(function() {
        var a = document.documentElement.scrollTop + document.body.scrollTop;
        if (a > 70) {
             $(".scrolltop").fadeIn(400)
        } else {
             $(".scrolltop").stop().fadeOut(400)
        }
    })