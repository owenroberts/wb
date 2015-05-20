$(document).ready( function() {
document.ontouchmove = function(e) {e.preventDefault()};
$('#nodes').on('touchmove', function(event){
	event.stopPropagation();
});
$('#adjust').on('touchmove', function(event){
	event.stopPropagation();
});

$('#nodes').animate({
	"margin-left":"32px"
}, 900, function() {
	$('.toggle').animate({width:"24px"}, 900, function() {
		var nodes = $('.node-dad');
		for (var i = 0; i < nodes.length; i++) {
			var showNode = function(num) {
				setTimeout( function() {
					$(nodes[num]).fadeIn();
				}, num*800);
			}(i);
		}
	});
});
$('.fadein').animate({
	opacity: 1
}, 900);

var undrag = function(elem) {
	elem.removeClass('selected');
	elem.removeClass('draggable');
	elem.draggable('destroy');
	elem.css({
			top:0,
			left:0
		});
	elem.find('.dots').css({transform:"rotate(0deg)"});
	elem.find('.node-btn').fadeOut();
}

var prevSelected;
$('.dots').on('click', function() {
	var parent = $(this).parent().parent();
	if (parent.hasClass('selected')) {
		undrag(parent);
		prevSelected = undefined;
	} else {
		if (prevSelected) {
			undrag(prevSelected);
		}
		$(this).css({transform:"rotate(-90deg)"});
		parent.addClass('selected');
		parent.addClass('draggable');
		parent.find('.node-btn').fadeIn(500);
		prevSelected = parent;
		var c = parent.children();
		var w = 0;
		for (var i = 0; i < c.length; i++) {
			w += $(c[i]).width();
			w += 24; // approx padding
		}
		var leftContain = -w + window.innerWidth;
		if (leftContain > 0 ) {
			leftContain = 32;
		}
		parent.css({width:w});
		parent.draggable({
			scroll:false,
			axis: 'x',
			containment: [leftContain, 0, 32, 0]
		});
	}
});

$('.draggable' ).draggable({
	scroll:false,
	axis: "x",
	containment:[-1000,0,32,0],
});


var adjust = false;
var adjustOffset = 260;
$('#adjust').css('left', -adjustOffset);
function adjustMenu() {
	if (!adjust) {
		$('#nodes').animate({
			'left': adjustOffset
		}, 500);
		$('#adjust').animate({
			'left': 0
		}, 500);
		adjust = true;
	} else {
		$('#nodes').animate({
			'left': 0
		}, 500);
		$('#adjust').animate({
			'left': -adjustOffset
		}, 500);
		adjust = false;
	}
}
$('.adjust-button').on('click', adjustMenu);

$('input[type="range"]').on('change', function() {
	$('#adjust input[type="submit"]').css({
		'color':'#6a75ff'
	});
	var e = $(this);
	e.next().children().css({color:"#c6c8ca"})
	e.next().children(':nth-child('+e[0].value+')').css({color:"black"});
});
$('.nodelim').children(':nth-child('+#{nodelimit}+')').css({color:"black"});
$('.synlev').children(':nth-child('+#{synonymlevel}+')').css({color:"black"});

// ** sidebar menu ** //
var menu = false;
var sidebarOffset = $('#sidebar').width();
$('#sidebar').css('left', -sidebarOffset);
function openMenu() {
	if (!menu) {
		$('#main').animate({
			'left': sidebarOffset
		}, 500);
		$('#sidebar').animate({
			'left': 0
		}, 500);
		menu = true;
	} else {
		$('#main').animate({
			'left': 0
		}, 500);
		$('#sidebar').animate({
			'left': -sidebarOffset
		}, 500);
		menu = false;
	}
}
$('.menu').on('click', openMenu);

$('input[value="Enter"]').on('click', function(e) {
	$('.adjust').slideUp();
	for (var i = 1; i < nodes.length - 1; i++) 
		$(nodes[i]).fadeOut();
	var ldr = $('<img>').attr({'class':'ldr', 'src':'/images/ldr.gif'});
	$(nodes[0]).after(ldr);
});

function modifyChain() {
	$('.noded').removeClass('noded');
	$(this).addClass('noded'); 

	var parent = $(this).parent();
	var synonym = parent[0].innerText;
	var nodeparent = parent.parent();
	var node = nodeparent.find('.node');
	var word = node[0].innerText;
	
	parent.siblings().animate({
		opacity: 0
	}, 500);

	var data = !{JSON.stringify(path)};
	var oldpath = data.slice(0, nodeparent.index());

	var container = $('<div>')
		.attr('id', 'modified-search');
	var submitBtn = $('<button>')
		.attr('id', 'mod')
		.text("Click to replace " + word + " with " + synonym);
	var cancelBtn = $('<button>')
		.attr('id', 'cancel')
		.html('Cancel');

	$(submitBtn).on('click', function() {
		$.ajax({
			url: '/search/modified',
			type: 'POST',
			data: {
				start: synonym,
				end: "#{end}",
				synonymlevel: #{synonymlevel},
				nodelimit: #{nodelimit} - nodeparent.index(),
				path: JSON.stringify(oldpath),
				success: function(data) {
					console.log(data);
				}
			}
		});
	});

	$(cancelBtn).on('click', function() {
		$('#modified-search').remove();
		parent.siblings().animate({
			opacity: 1
		}, 500);
	});

	

	container.append(submitBtn);
	container.append(cancelBtn);
	$('body').append(container);
	container.animate({opacity:1}, 500);

}

function makeNewChain() {
	
	$('.noded').removeClass('noded');
	$(this).addClass('noded'); 

	var parent = $(this).parent();
	var synonym = parent[0].innerText;
	var nodeparent = parent.parent();
	var node = nodeparent.find('.node');
	var word = node[0].innerText;
	


	var data = !{JSON.stringify(path)};
	var oldpath = data.slice(0, nodeparent.index());

	var container = $('<div>')
		.attr('id', 'modified-search');
	var form = $('<form>')
		.attr({
			'method':'post',
			'action':'/search/modified',
		});
	var start = $('<input>')
		.attr({
			'name':'start',
			'type':'hidden',
			'value':synonym
		});
	var end = $('<input>')
		.attr({
			'name':'end',
			'type':'hidden',
			'value':"#{end}"
		});
	var nodelimit = $('<input>')
		.attr({
			'name':'nodelimit',
			'type':'hidden',
			'value':#{nodelimit} - nodeparent.index()
		});
	var synonymlevel = $('<input>')
		.attr({
			'name':'synonymlevel',
			'type':'hidden',
			'value':#{synonymlevel}
		});
	var path = $('<input>')
		.attr({
			'name':'path',
			'type':'hidden',
			'value':JSON.stringify(oldpath)
			});
	var submit = $('<input>')
		.attr({
			'type':'submit',
			'id':'mod',
			'value':"Click to replace " + word + " with " + synonym
		});
	$(submit).on('click', function() {
		$('#modified-search').remove();
		for (var i = parent; i < nodes.length - 1; i++) 
			$(nodes[i]).fadeOut();
		var ldr = $('<img>').attr({'class':'ldr', 'src':'/images/ldr.gif'});
		$(nodes[parent]).after(ldr);
	});
	var cancel = $('<button>')
		.attr('id', 'cancel')
		.html('Cancel');
	$(cancel).on('click', function() {
		$('#modified-search').remove();
		parent.siblings().animate({
			opacity: 1
		}, 500);
	});

	parent.siblings().animate({
		opacity: 0
	}, 500);

	parent.css({color:'black'});
	parent.find('.node-btn').fadeOut();
	$(nodeparent[0]).css({'border-color':'transparent'});

	$(nodeparent[0]).animate({
		left: -parent.offset().left + 64 + 'px'
	}, 1000, function() {
		form.append(start).append(end).append(nodelimit).append(synonymlevel).append(path).append(submit);
		form.submit();
	});

	

}
$('.node-btn').on('click', makeNewChain);


// end document ready
});