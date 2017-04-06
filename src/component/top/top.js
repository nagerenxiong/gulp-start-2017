$(".top-icon-right").click(function() {
	$(".top .top-nav-slide").slideToggle(20);
	$(".center-top .top-nav-slidee").slideToggle(20);
	$(".tip-search .top-nav-slide").hide();
	$(".modal-bg").toggle();
});

$(".modal-bg").click(function() {
	$(".top .top-nav-slide").slideUp(20);
	$(".center-top .top-nav-slide").slideUp(20);
	$(".modal-bg").hide();
});
$(".top-nav-arrow").click(function() {
	$(".top .top-nav-slide").slideUp(20);
	$(".center-top .top-nav-slide").slideUp(20);
	$(".modal-bg").hide();
});