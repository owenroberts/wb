var scrollingDiv = document.querySelector('#main');
scrollingDiv.addEventListener('touchmove', function(event){
    event.stopPropagation();
});