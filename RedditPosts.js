(function($) {
    $.RedditPosts = function(element, options) {
        var defaults = {
            redditId: null,
            postId: null,
            start: 0,
            num: 50,
            tagged: null,
            ptype: null
        };

        var self = this;
        self.settings = {};
        self.reddit = {};
        var $element = $(element);
        
        self.init = function() {
            self.settings = $.extend({}, defaults, options);
            if (self.settings.redditId) self.load();
        };
        
        /// Public methods
        self.load = function (newOptions) {
            self.settings = $.extend(self.settings, newOptions);
            $.ajax({
                type: 'GET',
                cache: true,
                //https://www.reddit.com/r/x/.json
                url: 'https://www.reddit.com/r/' + self.settings.redditId + '.json?raw_json=1' + 
                    '&count=' + self.settings.start + '&limit=' + self.settings.num,
                dataType: 'jsonp',
                jsonpCallback: 'jqRedditHandlr',
                success: onLoad
            });
            clear();
        };
        
        /// Private methods
        var onLoad = function (reddit) {
            self.reddit = reddit;
            console.log(reddit);
            
            // Title
            $element.append('<h1>' + reddit.tumblelog.title + '</h1>');
            window.document.title = reddit.tumblelog.title + ' - Reddit';
                
            for (var i in reddit.posts) {
                if (reddit.posts[i].type == 'photo') {
                    imgPost(reddit.posts[i]);
                } else if (reddit.posts[i].type == 'regular') {
                    regPost(reddit.posts[i]);
                } else if (reddit.posts[i].type == 'video') {
                    videoPost(reddit.posts[i]);
                } else if (reddit.posts[i].type == 'audio') {
                    audioPost(reddit.posts[i]);
                } else {
                    console.log(reddit.posts[i]);
                }
            }
            forceVideoControls();
        };
        var clear = function () {
            $element.empty();
        };
        var forceVideoControls = function () {
            $element.find('video').each(function() {
                $(this).prop("controls", true);
            });
        };
        var cleanHTML = function (htmlText) {
            //return $('<span>' + htmlText + '</span>').text();
            var allTagsExcept = /<(?!\/?(a|p|br|blockquote)(?=>|\s.*>))\/?.*?>/ig;
            var result = htmlText.replace(allTagsExcept, '');
            //console.log({before: htmlText, after: result});
            return result;
        };
        var imgPost = function (post) {
            var $post = $('<div class="post"></div>');
            var photos = (post.photos && post.photos.length > 0) ? post.photos : [post];
            var photosHTML = ['<div class="images">'];
            var imgsrc;
            for (var i in photos) {
                imgsrc = photos[i]['photo-url-500'].match(/\.gif$/ig) ? photos[i]['photo-url-500'] : photos[i]['photo-url-1280'];
                photosHTML.push('<a class="nolink hoverZoomLink" href="' + imgsrc + '" target="_blank">',
                '<img src="' + imgsrc + '">',
                '</a>');
            }
            photosHTML.push('</div>');
            $post.append(photosHTML.join(''));
            
            if (post['photo-caption']) {
                $post.append('<div class="caption">' + cleanHTML(post['photo-caption']) + '</div>');
            }
            addSource($post, post);
            $element.append($post);
        };
        var videoPost = function (post) {
            if (post['video-player-500']) {
                var $post = $('<div class="post"></div>');
                var vidClass = post['video-player-500'].match(/<video/ig) ? 'html5-video' : 'video';
                $post.append('<div class="' + vidClass + '">' + post['video-player-500'] + '</div>');
                
                if (post['video-caption']) {
                    $post.append('<div class="caption">' + cleanHTML(post['video-caption']) + '</div>');
                }
                addSource($post, post);
                $element.append($post);
            }
        };
        var audioPost = function (post) {
            var $post = $('<div class="post"></div>');
            $post.append('<div class="audio">' + post['audio-player'] + '</div>');
            
            if (post['audio-caption']) {
                $post.append('<div class="caption">' + cleanHTML(post['audio-caption']) + '</div>');
            }
            addSource($post, post);
            $element.append($post);
        };
        var regPost = function (post) {
            var $post = $('<div class="post"></div>');
            if (post['regular-title']) {
                $post.append('<h2>' + post['regular-title'] + '</h2>');
            }
            if (post['regular-body']) {
                $post.append('<div class="images"><a class="nolink" href="' + post['url-with-slug'] + '" target="_blank">' + post['regular-body'] + '</a></div>');
            }
            addSource($post, post);
            $element.append($post);
        };
        var addSource = function ($post, post) {
            $post.append(
                '<div class="source">Source: <a href="' + post['url-with-slug'] + '" target="_blank">' + post['url-with-slug'] + '</a>' + 
                (post.hasOwnProperty('photo-link-url') ? ' Link: <a href="' + post['photo-link-url'] + '" target="_blank">' + post['photo-link-url'] + '</a>' : '') + 
                '</div>'
            );
        };

        self.init();
    };

    $.fn.RedditPosts = function(options) {
        return this.each(function() {
            if (undefined === $(this).data('RedditPosts')) {
                var plugin = new $.RedditPosts(this, options);
                $(this).data('RedditPosts', plugin);
            }
        });
    };

})(jQuery);

/* Setup page stuff */
$(function() {
    //window.redditPosts = $('#images').RedditPosts({redditId: 'fer1972'}).data('RedditPosts');
    
    window.redditPosts = $('#images').RedditPosts().data('RedditPosts');
    $(window).resize(function () {
        var w = $(window).height() * 2 / 3; // Most images are 3/2, fit to screen height
        $('#imgwidth').text("#images,#form {max-width: " + w + "px;}");
    });
    $(window).trigger('resize');
    var prevId;
    $('#form').submit(function(e) {
        e.preventDefault();
        if ($('#redditId').val() !== prevId) $('#start').val(0);
        var params = {
            redditId: $('#redditId').val(),
            postId: $('#postId').val(),
            tagged: $('#tagged').val(),
            ptype: $('input[name="ptype"]:checked').val(),
            start: $('#start').val(),
            num: $('#num').val()
        };
        prevId = params.redditId;
        //console.log(params);
        //redditPosts.load(params);
        $.bbq.pushState(params);
        
        // Hide input form
        $('#showform, #navigation').show();
        $('#inputform').hide();
    });
    $('#first').click(function(e) {
        e.preventDefault();
        var pos = 0;
        $('#start').val(pos);
        $('#form').submit();
        window.scrollTo(0, 0);
    });
    $('#prev').click(function(e) {
        e.preventDefault();
        var start = parseInt($('#start').val());
        var num = parseInt($('#num').val());
        var pos = start - num;
        pos = pos >= 0 ? pos : 0;
        $('#start').val(pos);
        $('#form').submit();
        window.scrollTo(0, 0);
    });
    $('#next').click(function(e) {
        e.preventDefault();
        var start = parseInt($('#start').val());
        var num = parseInt($('#num').val());
        var end = redditPosts.reddit['posts-total'] - num;
        var pos = start + num;
        pos = pos <= end ? pos : end;
        pos = pos > 0 ? pos : 0;
        $('#start').val(pos);
        $('#form').submit();
        window.scrollTo(0, 0);
    });
    $('#last').click(function(e) {
        e.preventDefault();
        var num = parseInt($('#num').val());
        var pos = redditPosts.reddit['posts-total'] - num;
        pos = pos > 0 ? pos : 0;
        $('#start').val(pos);
        $('#form').submit();
        window.scrollTo(0, 0);
    });
    $('#toggleadvopts').click(function(e) {
        e.preventDefault();
        $('#advoptions').toggle();
    });
    $('#showform a').click(function(e) {
        e.preventDefault();
        $('#showform, #inputform').toggle();
    });
    $(window).bind('hashchange', function(e) {
        if (e.fragment === "") return;
        var params = e.getState();
        $('#redditId').val(params['redditId']);
        $('#postId').val(params['postId']);
        $('#tagged').val(params['tagged']);
        $('input[name="ptype"][value="' + params['ptype'] + '"]').prop('checked', true);
        $('#start').val(params['start']);
        $('#num').val(params['num']);
        //console.log(params);
        prevId = params.redditId;
        redditPosts.load(params);
        
        // Hide input form
        $('#showform, #navigation').show();
        $('#inputform').hide();
    });
    $(window).trigger('hashchange');
});