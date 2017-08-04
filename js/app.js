//
// WebDB: AJAX-driven w3 API storage interface layer

class WebDB {
	constructor(url) {
		this.api = url;
		try{
			this.xhr = new window.XMLHttpRequest() || new ActiveXObject('Microsoft.XMLHTTP') || new ActiveXObject('Msxml2.XMLHTTP') || null;
		}
		catch(e){
			this.xhr = null;
		}
		if(null == this.xhr){
			alert('No AJAX support found, can\'t proceed.');
			this.xhr = {};
		}
	}
	create(e) {
		if(undefined != e.length){
			let f = e;
			for(e in f){
				if('_id' in f[e]){
					delete f[e]._id;
				}
			}
			e = f;
		} else {
			if('_id' in e){
				delete e._id;
			}
		}
		this.xhr.open('POST', this.api, false);
		this.xhr.setRequestHeader('content-type','application/json');
		this.xhr.send(JSON.stringify(e));
		if(200 == this.xhr.status) {
			let j = this.dejson(this.xhr.responseText);
			if('errors' in j){
				console.error(j.errors);
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}
	read() {
		let addon = ('undefined' != typeof arguments[0]) ? '/' + arguments[0] : '';
		this.xhr.open('GET', this.api + addon, false);
		this.xhr.send(null);
		if (200 == this.xhr.status) {
			return this.dejson(this.xhr.responseText);
		} else /*if(404 == this.xhr.status)*/ {
			return null;
		}
	}
	update(e,d) {
		if('_id' in d){
			delete d._id;
		}
		this.xhr.open('PATCH', this.api + '/' + e, false);
		this.xhr.send(JSON.stringify(d));
		if(200 == this.xhr.status) {
			let j = this.dejson(this.xhr.responseText);
			if('errors' in j){
				console.error(j.errors);
				return false;
			} else {
				return true;
			}
		} else {
			return false;
		}
	}
	delete(e) {
		let addon = ('overkill' != e) ? '/' + e : '';
		this.xhr.open('DELETE', this.api + addon, false);
		this.xhr.send(null);
		return (200 == this.xhr.status);
	}
	dejson(j) {
		return 'undefined' != typeof window.JSON ? JSON.parse(j) : eval(j);
	}
}

// PageIndex: index page functions
class PageIndex {
	constructor(app) {
		this.app = app;
		this.sorting = [0,1];
		this.filter = '';
		this.timer = null;
	}
	//
	buildTableInner(ksort) {
		let tbx = '';
		let su = Array.from(this.app.db).filter(e => '' == this.filter || -1 != e.fullName.toLowerCase().indexOf(this.filter.toLowerCase()) || -1 != e.phone.toLowerCase().indexOf(this.filter.toLowerCase()));
		if(undefined != this.app.thcfg[ksort]){
			let x = (this.sorting[0] == ksort && !this.sorting[1]) ? 1 : -1;
			let y = (this.sorting[0] == ksort && !this.sorting[1]) ? -1 : 1;
			su.sort((a,b) => (a[this.app.thcfg[ksort][0]] > b[this.app.thcfg[ksort][0]]) ? x : y);
			//
			if(this.sorting[0] == ksort)
				this.sorting[1] = (this.sorting[1]) ? 0 : 1;
			else
				this.sorting[1] = 0;
			this.sorting[0] = ksort;
		}
		if(su.length)
			su.forEach(e => tbx += `<tr id="${e._id}"><td>${e.fullName}</td><td>${e.phone}</td></tr>`);
		else
			tbx += '<tr><td colspan="2">No data</td></tr>';
		let tbl = '';
		this.app.thcfg.forEach(e => tbl += `<th>${e[1]}</th>`);
		return `<thead><tr id="zzzero">${tbl}</tr></thead><tbody>${tbx}</tbody>`;
	}
	//
	getPage(ksort) {
		let tbl = this.buildTableInner(ksort);
		return `<main><div class="container"><form class="form-inline search-form"><div class="form-group"><label class="sr-only" for="search">Search</label><input type="text" id="search" class="form-control" id="search" placeholder="Search" autocomplete="off"></div></form><table class="table table-hover contacts">${tbl}</table></div></main>`;
	}
	bind() {
		let zzxfwd = this;
		/*document.getElementById('overkill').onclick = function(){
			zzxfwd.app.dbc.delete('overkill');
		};*/
		Array.from(document.getElementsByTagName('th')).forEach((e,i) => {
			e.onclick = () => {
				zzxfwd.render(i);
			};
		});
		Array.from(document.getElementsByTagName('tr')).forEach((e,i) => {
			if('zzzero' != e.id) {
				e.onclick = () => {
					zzxfwd.app.db.forEach(f => {
						if(e.id == f._id)
							zzxfwd.app.user = f;
					});
					zzxfwd.app.page = 'user';
					zzxfwd.app.loadPageHandler();
					setTimeout(function(){
						zzxfwd.app.render();
					},0);
					return false;
				};
			}
		});
		document.getElementById('search').addEventListener('keyup',function(){
			zzxfwd.filter = this.value;
			if(null != zzxfwd.timer)
				clearTimeout(zzxfwd.timer);
			zzxfwd.timer = setTimeout(function(){zzxfwd.render();},80);
		});
	}
	render() {
		let ksort = undefined != arguments[0] ? arguments[0] : null;
		let tblz = document.getElementsByTagName('table');
		if(tblz.length && tblz[0].className.match(/contacts/)) {
			tblz[0].innerHTML = this.buildTableInner(ksort);
		} else {
			document.body.innerHTML += this.getPage(ksort);
		}
		this.bind();
	}
}

// PageKeypad: keypad page functions
class PageKeypad {
	constructor(app) {
		this.app = app;
	}
	//
	numField() {
		let e = null;
		Array.from(document.getElementsByTagName('span')).forEach(f => {
			if ('undefined' != typeof f.className && 'numbers' == f.className) {
				e = f;
			}
		});
		return e;
	}
	saveData(){
		let f = this.numField();
		if(f)
			sessionStorage.setItem('keypad_number',f.innerHTML);
	}
	inputNum(char) {
		let f = this.numField();
		if(f) {
			if (7 <= f.innerHTML.length && !isNaN(f.innerHTML) && !isNaN(char)) {
				f.innerHTML = '(' + f.innerHTML.slice(0, 3) + ')-' + f.innerHTML.slice(3, 6) + '-' + f.innerHTML.slice(6, 7);
			} else if (!f.innerHTML.match(/^\(\d{3}\)\-\d{3}\-\d{2}\-\d{2}$/) && isNaN(f.innerHTML) && isNaN(char)) {
				f.innerHTML = f.innerHTML.replace(/(\(|\)|\-)/g, '');
			} else if (f.innerHTML.match(/^\(\d{3}\)\-\d{3}\-\d{2}$/) && !isNaN(char)) {
				f.innerHTML += '-';
			} else if (f.innerHTML.match(/^\(\d{3}\)\-\d{3}\-\d{2}\-\d{2}$/) && !isNaN(char)) {
				f.innerHTML += ' ';
			} else if (f.innerHTML.match(/^\(\d{3}\)\-\d{3}\-\d{2}\-\d{2}/) && f.innerHTML.length > 23) {
				return;
			}
			f.innerHTML += char;
			this.saveData();
		}
	}
	trimNum() {
		let f = this.numField();
		if(f && 0 < f.innerHTML.length) {
			f.innerHTML = f.innerHTML.slice(0,-1);
			this.saveData();
		}
	}
	//
	getPage() {
		let num = sessionStorage.getItem('keypad_number');
		if(null == num)
			num = '';
		return `<main class="main"><div class="container"><div class="number"><span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span><span class="numbers">${num}</span><span class="glyphicon glyphicon-circle-arrow-left" aria-hidden="true"></span></div><div class="keypad-holder"><button class="key">1</button><button class="key">2</button><button class="key">3</button><button class="key">4</button><button class="key">5</button><button class="key">6</button><button class="key">7</button><button class="key">8</button><button class="key">9</button><button class="key">*</button><button class="key">0</button><button class="key">#</button><button class="key"><span class="glyphicon glyphicon-earphone" aria-hidden="true"></span></button></div></div></main>`;
	}
	bind() {
		let zzxfwd = this;
		Array.from(document.getElementsByTagName('button')).forEach(e => {
			if('undefined' != typeof e.className && 'key' == e.className && e.innerHTML.match(/^[\d*#]+$/)){
				e.onclick = function(){zzxfwd.inputNum(e.innerHTML);}
			}
		});
		Array.from(document.getElementsByTagName('span')).forEach(f => {
			if('undefined' != typeof f.className && -1 !== f.className.indexOf('glyphicon-circle-arrow-left')){
				f.onclick = function(){zzxfwd.trimNum();};
			}
		});
		window.onkeypress = n => {
			if('keypad' != zzxfwd.app.page)
				return;
			if ((n.charCode >= 48 && n.charCode <= 57) || n.charCode == 35 || n.charCode == 42) {
				n.preventDefault();
				zzxfwd.inputNum(n.key);
			} else if (n.keyCode == 8) {
				n.preventDefault();
				zzxfwd.trimNum();
			}
		};
	}
	render() {
		let ksort = (undefined != arguments[0]) ? arguments[0] : null;
		let z = document.getElementsByTagName('main');
		if(undefined != z[0])
			z[0].outerHTML = this.getPage(ksort);
		else
			document.body.innerHTML += this.getPage(ksort);
	}
}

// PageUser: user info read wrapper
class PageUser {
	constructor(app) {
		this.app = app;
	}
	getPage() {
		if(!this.app.user)
			return '<main class="main"><div class="container"><h1>No user selected</h1></div></main>';
		const opts1 = [
			['message','comment'],
			['call','earphone'],
			['video','facetime-video'],
			['mail','envelope']
		];
		const opts2 = [
			'Notes',
			'Send message',
			'Share contact',
			'Add to favorites',
			'Share my location',
			'Block this caller'
		];
		const img = ('avatarUrl' in this.app.user) ? this.app.user.avatarUrl : 'images/nophoto2x.png';
		//
		let ol1 = '';
		for(let i in opts1){
			ol1 += `<div class="${opts1[i][0]}"><div class="options-icon"><span class="icon glyphicon glyphicon-${opts1[i][1]}" aria-hidden="true"></span></div><span class="options-text">${opts1[i][0]}</span></div>`;
		}
		//
		let ol2 = '';
		for(let i in opts2){
			ol2 += `<div class="options-item"><a href="#">${opts2[i]}</a></div>`;
		}
		//
		let fullName = this.app.user.fullName;
		let phone = this.app.user.phone;
		return `<main class="main"><div class="container"><img src="${img}" alt="#" class="user-img img-circle center-block"><div class="user-name">${fullName}</div><div class="options-line">${ol1}</div><div class="tel-number"><h3>Phone</h3><div>${phone}</div></div><div class="options-table">${ol2}</div></div></main>`;
	}
	bind() {
		//
	}
	render() {
		let z = document.getElementsByTagName('main');
		if(undefined != z[0])
			z[0].outerHTML = this.getPage();
		else
			document.body.innerHTML += this.getPage();
	}
}

// PageForm: add/edit form wrapper
class PageForm {
	constructor(app) {
		this.app = app;
	}
	//
	getEditField() {
		let out = '';
		//
		if(undefined == arguments[0])
			return out;
		if(undefined == arguments[1])
			out = arguments[0];
		else if(1 === arguments[1])
			out = `<button class="delete-btn" id="${arguments[0][0]}"><span class="glyphicon glyphicon-minus-sign" aria-hidden="true"></span><span>${arguments[0][1]}</span><span>${this.app.user[arguments[0][0]]}</span></button>`;
		else if (0 === arguments[1])
			out = `<button class="add-btn" id="${arguments[0][0]}"><span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span><span>Add ${arguments[0][1]}</span></button>`;
		out = `<div class="edit-field">${out}</div>`;
		return out;
	}
	//
	getPage() {
		let av = (this.app.user && 'avatarUrl' in this.app.user && this.app.user.avatarUrl) ? '<img src="'+ this.app.user.avatarUrl +'" alt="#" class="user-img img-circle center-block">' : '<button class="add-foto-btn"><span class="glyphicon glyphicon-plus-sign" aria-hidden="true"></span><span>Add photo</span></button>';
		av = `<div class="edit-foto">${av}</div>`;
		let un = (this.app.user && 'fullName' in this.app.user && this.app.user.fullName) ? this.app.user.fullName : '';
		const nm = this.getEditField('<input type="text" id="fullName" name="fullName" value="'+un+'" placeholder="Contact name">');
		//
		const uk = [
			//['fullName','Full name'],
			['phone', 'Phone'],
			['email', 'Email'],
			//['avatarUrl', 'Photo URL'],
			['address', 'Address']
		];
		let opts = '';
		for(var i in uk){
			opts += this.getEditField(uk[i], ((this.app.user && uk[i][0] in this.app.user && this.app.user[uk[i][0]]) ? 1 : 0));
		}
		//
		let out = `<div class="edit-main-info">${av}</div><div class="main-info-holder">${nm}</div><div class="scroll-holder"><div class="edit-info">${opts}<div class="edit-field"><button class="delete-contact" id="trigger-delete">Delete contact</button></div></div></div>`;
		return `<main class="main"><div class="container">${out}</div></main>`;
	}
	bind() {
		Array.from(document.getElementsByTagName('button')).forEach(e => {
			//if('add-btn' ==)
		});
	}
	render() {
		let z = document.getElementsByTagName('main');
		if(undefined != z[0])
			z[0].outerHTML = this.getPage();
		else
			document.body.innerHTML += this.getPage();
	}
}

// PhoneBookApplication: main application implementation

class PhoneBookApplication {
	constructor(url) {
		try {
			this.dbc = new WebDB(url);
		}
		catch(e){
			alert('No AJAX!');
		}
		this.thcfg = [
			['fullName','Name'],
			['phone','Phone']
		];
		this.user = null;
		this.page = 'index';
		this.loadPageHandler();
		this.initDB();
	}
	initDB() {
		this.db = this.dbc.read();
		if(null == this.db) {
			console.error('WebDB: read error');
			this.populateDB();
		}
	}
	populateDB() {
		const email_suffix = '@example.com';
		const seed = [
			['Vova Boom', '(099)-934-85-68'],
			['Valera Leroy', '(096)-890-74-89'],
			['Victor Rak', '(093)-541-68-75'],
			['Roma Lesovoy', '(097)-614-68-65'],
		];
		for(var xe in seed){
			let e = seed[xe];
			let b = {
				fullName: e[0],
				email: 'pbatest'+parseInt(Math.ceil(Math.random()*1000))+email_suffix,
				phone: e[1]
			};
			this.dbc.create(b) || console.error('WebDB: create error');
		}
		this.initDB();
	}
	loadPageHandler() {
		switch (this.page){
			case 'keypad':
				this.ph = new PageKeypad(this);
			break;
			case 'user':
				this.ph = new PageUser(this);
			break;
			case 'add':
				this.user = null;
			case 'edit':
				this.ph = new PageForm(this);
			break;
			default:
				this.ph = new PageIndex(this);
			break;
		}
	}
	getTitle(s) {
		const ht = {
			'index':	'Contacts',
			'keypad':   'Keypad',
			'edit':	 'Edit contact',
			'user':	 'User',
			'add':	  'Add user'
		};
		return (s in ht) ? ht[s] : '';
	}
	getHeader() {
		let header_customs = {
			'edit': '<nav class="user-top-line"><a class="trg" href="user.html">Cancel</a><button class="done-btn">Done</button></nav>',
			'user': '<div class="user-top-line"><a class="trg" href="index.html"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>Contacts</a><a class="trg" href="edit.html">Edit</a></div>',
			'add': '<nav class="user-top-line"><a class="trg" href="user.html">Cancel</a><button class="done-btn">Done</button></nav>'
		};
		let h = (this.page in header_customs) ? header_customs[this.page] : '<h2>'+this.getTitle(this.page)+'</h2>';
		return `<header class="header"><div class="container top-radius">${h}</div></header>`;
	}
	getFooter() {
		let footer_menu_keys = [
			['index','search'],
			['keypad','th'],
			['edit','pencil'],
			['user','user'],
			['add','plus']
		];
		let footer_menu = '';
		for(let xm in footer_menu_keys){
			let m = footer_menu_keys[xm];
			let active = this.page == m[0] ? ' active' : '';
			let title = this.getTitle(m[0]);
			footer_menu += `<a href="${m[0]}.html" class="trg tab${active}"><span class="glyphicon glyphicon-${m[1]}" aria-hidden="true"></span><span class="tab-text">${title}</span></a>`;
		}
		return `<footer class="footer"><div class="container bottom-radius"><nav class="main-nav">${footer_menu}</nav></div></footer>`;
	}
	getMain() {
		return this.ph.getPage();
	}
	//
	bind() {
		let appclass = this;
		//
		Array.from(document.getElementsByClassName('trg')).forEach(e => {
			if('a' == e.tagName.toLowerCase()){
				e.onclick = () => {
					appclass.page = e.href.replace(/.+?\/([^\/]+).html$/,'$1');
					appclass.loadPageHandler();
					setTimeout(function(){
						appclass.render();
					},0);
					return false;
				};
			}
		});
		Array.from(document.getElementsByClassName('done-btn')).forEach(e => {
			e.onclick = () => {
				appclass.page = 'index';
				appclass.loadPageHandler();
				setTimeout(function(){
					appclass.render();
				},0);
				return false;
			};
		});
	}
	render() {
		const rk = ['header','main','footer'];
		for(let xk in rk) {
			let k = rk[xk];
			let b = ('header' == k) ? this.getHeader() : ('footer' == k ? this.getFooter() : this.getMain());
			let x = document.getElementsByTagName(k);
			if ('header' == k) {
				document.body.innerHTML = !x.length ? b : document.body.innerHTML.replace(new RegExp('<' + k + '.+?<\/' + k + '>'), b);
			} else if (!x.length) {
				document.body.innerHTML += b;
			} else {
				document.body.innerHTML = document.body.innerHTML.replace(new RegExp('<' + k + '.+?<\/' + k + '>'), b);
			}
		}
		this.bind();
		this.ph.bind();
	}
}

// const app = new PhoneBookApplication('https://easycode-js.herokuapp.com/Vova/users');

// const api_url = 'https://easycode-js.herokuapp.com/Vova/users';
// ...
// const app = new PhoneBookApplication(api_url);

