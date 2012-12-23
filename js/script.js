var Book = Backbone.Model.extend({
    initialize: function() {
	if(!this.get("title"))
	    this.destroy();
	if(!this.has("author"))
	    this.set("author", "")
	if(!this.has("read"))
	    this.set("read", false)
    },
    toggle: function() {
	this.save({done: !this.get("done")});
    }
});


var BookList = Backbone.Collection.extend({
    model: Book,
    localStorage: new Backbone.LocalStorage("shelfari"),
    read: function() {
	return this.filter(function(book) { return book.get("read"); });
    },
    unread: function() {
	return this.filter(function(book) { return !book.get("read"); });
    },
    comparator: function(book) {
	return book.get("title").toLowerCase().replace( /(^the\s|^a\s|^an\s)/ , "");
    }
});

var Books = new BookList, currBooks = Books;


var BookView = Backbone.View.extend({
    tagName: "div",
    className: "book",
    
    model: Book,
    
    template: _.template('<div class="editBook">Edit</div><div class="title"><%= this.model.get("title") %></div><div class="author"><%= this.model.get("author") %></div>'), 
    read_status: _.template('You have <%= this.model.get("read")?"":"not " %>read this book'),
    
    events: {
	"click": "editBook"
    },
    
    initialize: function() {
	this.$el.addClass( (this.model.get("read")?"":"un") + "read");
	this.$el.attr("title", this.read_status());
	this.listenTo(this.model, "change", this.render);
	this.listenTo(this.model, "destroy", this.remove);
    },

    render: function() {
	this.$el.html(this.template(this.model.toJSON()));
	return this;
    },

    toggleRead: function() {
	this.model.toggle();
    },

    editBook: function(e) {
	if(Shelf.view == "tiled")
	    App.render(this.model);
	if(Shelf.view == "list" && $(e.target).attr("class") == "editBook")
	    App.render(this.model);
    }
});


var ShelfView = Backbone.View.extend({
    el: $("#shelf"),
    view: "tiled",
    statsTemplate: _.template('Hellow <%= title %>'),
    s_timer: undefined, // search debounce timer
    add_timer: undefined,
    
    events: {
	"keydown #search": "search",
	"click .switch": "toggleView",
	"click .add": "newBook"
    },

    initialize: function() {
	this.listenTo(Books, "add", this.addOne);
	this.listenTo(Books, "change", this.render);
	this.listenTo(Books, "destroy", this.render);
	
	Books.fetch();
    },
    render: function() {
	console.log("render");
	Shelf.$el.children("#books").html("");
	
	currBooks.each(function(book) {
	    var bookview = new BookView({model: book});
	    Shelf.$el.children("#books").append(bookview.render().el);
	});
	return this;
    },
    search: function() {
	clearTimeout(this.s_timer);
	s_timer = setTimeout(function() {
	    if($("#search").val() == "") {
		if(currBooks != Books) {
		    currBooks = Books;
		    Shelf.render();
		    $("#search").focus();
		}
		return;
	    }
	    currBooks = new BookList;
	    console.log("searching for " + $("#search").val());
	    Books.each(function(book) {
		if(book.get("title").toLowerCase().indexOf( $("#search").val().toLowerCase() ) != -1)
		    currBooks.add(book.toJSON());
		else if(book.get("author").toLowerCase().indexOf( $("#search").val().toLowerCase() ) != -1)
		    currBooks.add(book.toJSON());
	    });
	    Shelf.render();
	    $("#search").focus();
	}, 300);
    },
    toggleView: function() {
	if(this.view == "tiled") {
	    this.view="list";
	    $("#shelf").attr("class", this.view);
	    $("body").css("background", "white");
	}
	else {
	    this.view="tiled";
	    $("#shelf").attr("class", this.view);
	    $("body").attr("style", "background-image: url(../images/bg.png')");
	}
    },
    newBook: function() {
	App.render();
    },
    addOne: function() {
	var x=5;
	clearTimeout(this.add_timer);
	this.add_timer = setTimeout(this.render, 100);
    }
});

var AppView = Backbone.View.extend({
    el: "#lightbox",
    up_template: _.template('<textarea class="title" rows="3"><%= title %></textarea>\n<textarea class="author" rows="2"><%= author %></textarea>'),
    events: {
	"click .bg": "close"
    },
    render: function(model) {
	if(typeof(model) != 'undefined')
	    this.$el.children(".updateBook").html(this.up_template({ title: model.get("title"), author: model.get("author") }));
	else 
	    this.$el.children(".updateBook").html(this.up_template({ title: "Title", author: "Author" }));

	this.$el.children(".bg").css({
	    opacity: .4
	}).animate({
	    opacity: 1
	}, 300);
	this.$el.children(".updateBook").css({
	    top: "300px"
	}).animate({
	    top: "100px"
	}, 300);
	this.$el.show();
	this.$el.children(".updateBook").children(".title").focus();
    },
    close: function() {	
	var that=this;
	this.$el.children(".bg").animate({
	    opacity: .7
	}, 120);
	this.$el.children(".updateBook").animate({
	    top: "300px"
	}, 120);
	
	setTimeout(function() {	
	    that.$el.hide();
    
	}, 200);
    }
});

var Shelf = new ShelfView(),
App = new AppView();

Books.add(_stockBooks);
Books.add([
    {title: "the new book"},
    {title: "the old book"},
    {title: "the other book"}
]);

Shelf.render();

