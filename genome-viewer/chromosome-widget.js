function ChromosomeWidget(parent, args) {
	
	this.id = Math.round(Math.random()*10000000);
	if(args != null){
		if(args.type != null){
			this.type = args.type;
		}
		if(args.width != null){
			this.width = args.width;
		}
		if(args.height != null){
			this.height = args.height;
		}
		if(args.species != null){
			this.species = args.species;
		}
		if(args.chromosome != null){
			this.chromosome = args.chromosome;
		}
		if(args.zoom != null){
			this.zoom = args.zoom;
		}
		if(args.position != null){
			this.position = args.position;
		}
	}

	this._createPixelsbyBase();//create pixelByBase array
	this.tracksViewedRegion = this.width/this._getPixelsbyBase(this.zoom);
	
	this.onClick = new Event();
	
	this.svg = SVG.init(parent,{
		"width":this.width,
		"height":this.height
	});
	
	this.colors = {gneg:"white", stalk:"#666666", gvar:"#CCCCCC", gpos25:"silver", gpos33:"lightgrey", gpos50:"gray", gpos66:"dimgray", gpos75:"darkgray", gpos100:"black", gpos:"gray", acen:"blue"};
};


ChromosomeWidget.prototype.drawKaryotype = function(){
	var _this = this;

	var sortfunction = function(a, b) {
		var IsNumber = true;
		for (var i = 0; i < a.length && IsNumber == true; i++) {
			if (isNaN(a[i])) {
				IsNumber = false;
			}
		}
		if (!IsNumber) return 1;
		return (a - b);
	};
	
	var cellBaseManager = new CellBaseManager(this.species);
 	cellBaseManager.success.addEventListener(function(sender,data){
 		var chromosomeList = data.result;
 		chromosomeList.sort(sortfunction);
 		var x = 20;
 		var xOffset = _this.width/chromosomeList.length;
 		var yMargin = 2;
 		
 		var cellBaseManager2 = new CellBaseManager(_this.species);
 		cellBaseManager2.success.addEventListener(function(sender,data2){
 			//calcular chromosoma mas largo
 			var biggerChr = 0;
 			for(var i=0, len=chromosomeList.length; i<len; i++){
 				var size = data2.result[i][data2.result[i].length-1].end;
 				if(size > biggerChr) biggerChr = size;
 			}
 			_this.pixelBase = (_this.height - 10) / biggerChr;
 			_this.chrOffsetY = {};
 			_this.chrOffsetX = {};
 			
 			for(var i=0, len=chromosomeList.length; i<len; i++){ //loop over chromosomes
 				var chr = data2.result[i][0].chromosome;
 				chrSize = data2.result[i][data2.result[i].length-1].end * _this.pixelBase;
 				var y = yMargin + (biggerChr * _this.pixelBase) - chrSize;
 				_this.chrOffsetY[chr] = y;
 		 		var firstCentromere = true;
 		 		var pointerPosition = (_this.position * _this.pixelBase);
 		 		
 				var group = SVG.addChild(_this.svg,"g",{"cursor":"pointer"});
 				$(group).click(function(event){
 					var chrClicked;
 					for ( var k=0, len=chromosomeList.length; k<len; k++) {
						if(event.clientX > _this.chrOffsetX[chromosomeList[k]]) chrClicked = chromosomeList[k];
					}
 					var clickPosition = parseInt((event.offsetY - _this.chrOffsetY[chrClicked])/_this.pixelBase);
// 					console.log(event.offsetY - _this.chrOffsetY[chrClicked])
// 					console.log("y: "+_this.chrOffsetY[chrClicked])
// 					console.log("click: "+event.offsetY)
// 					console.log("Click position: "+clickPosition)
// 					console.log(_this.chrOffsetX[chrClicked])
 					
 					_this.positionBox.setAttribute("x1",_this.chrOffsetX[chrClicked]-9);
 					_this.positionBox.setAttribute("x2",_this.chrOffsetX[chrClicked]+22);
 					_this.positionBox.setAttribute("y1",event.offsetY);
 					_this.positionBox.setAttribute("y2",event.offsetY);
 					
 					_this.chromosome = chrClicked;
 					_this.onClick.notify({chromosome:chrClicked, position:clickPosition});
 				});
 				
 				for ( var j=0, lenJ=data2.result[i].length; j<lenJ; j++){ //loop over chromosome objects
 					var height = _this.pixelBase * (data2.result[i][j].end - data2.result[i][j].start);
 					var width = 13;

 					var color = _this.colors[data2.result[i][j].stain];
 					if(color == null) color = "purple";
 					
 					if(data2.result[i][j].stain == "acen"){
 						var points = "";
 						var middleX = x+width/2;
 						var middleY = y+height/2;
 						var endX = x+width;
 						var endY = y+height;
 						if(firstCentromere){
 							points = x+","+y+" "+endX+","+y+" "+endX+","+middleY+" "+middleX+","+endY+" "+x+","+middleY;
 							firstCentromere = false;
 						}else{
 							points = x+","+endY+" "+x+","+middleY+" "+middleX+","+y+" "+endX+","+middleY+" "+endX+","+endY;
 						}
 						SVG.addChild(group,"polyline",{
 							"points":points,
 							"stroke":"black",
 							"opacity":0.8,
 							"fill":color
 						});
 					}else{
 						SVG.addChild(group,"rect",{
 	 						"x":x,
 	 						"y":y,
 	 						"width":width,
 	 						"height":height,
 	 						"stroke":"grey",
 	 						"opacity":0.8,
 	 						"fill":color
 	 					});
 					}

 					y += height;
 				}
 				var text = SVG.addChild(_this.svg,"text",{
 					"x":x+1,
 					"y":_this.height,
 					"font-size":9,
 					"fill":"black"
 				});
 				text.textContent = chr;
 				
 				if(chr == _this.chromosome){
// 					var px1=x-15, px2=x-1, py1=pointerPosition+yOffset, py2=py1-5, py3=py1+5;
// 					var points = px1+","+py2+" "+px2+","+py1+" "+px1+","+py3+" "+px1+","+py1;
// 					_this.positionBox = SVG.addChild(_this.svg,"polyline",{
//// 			 			"x":x-9,
//// 						"y":pointerPosition + yOffset,
//// 						"width":7,
//// 						"height":3,
// 						"points":points,
//// 						"stroke":"orangered",
//// 						"stroke-width":2,
//// 						"opacity":0.3,
// 			 			"fill":"orange"
// 			 		});
 					
 					_this.positionBox = SVG.addChild(_this.svg,"line",{
 			 			"x1":x-9,
 						"y1":pointerPosition + _this.chrOffsetY[_this.chromosome],
 						"x2":x+22,
 						"y2":pointerPosition + _this.chrOffsetY[_this.chromosome],
 						"stroke":"orange",
 						"stroke-width":2
 					});
 				}
 				
 				_this.chrOffsetX[chr] = x;
 				x += xOffset;
 			}
 		});
 		cellBaseManager2.get("genomic", "region", chromosomeList.toString(),"cytoband");
 	});
 	cellBaseManager.get("feature", "karyotype", "none", "chromosome");
	
};

ChromosomeWidget.prototype.drawHorizontal = function(){
	var _this = this;

	var cellBaseManager = new CellBaseManager(this.species);
 	cellBaseManager.success.addEventListener(function(sender,data){
 		_this.pixelBase = (_this.width -40) / data.result[0][data.result[0].length-1].end;
 		var x = 20;
 		var y = 10;
 		var firstCentromere = true;
 		
 		var offset = 20;
 		var pointerPosition = (_this.position * _this.pixelBase) + offset;
 		
 		var group = SVG.addChild(_this.svg,"g",{"cursor":"pointer"});
		$(group).click(function(event){
			var clickPosition = parseInt((event.clientX - offset)/_this.pixelBase);
			var positionBoxWidth = parseFloat(_this.positionBox.getAttribute("width"));
			
			_this.positionBox.setAttribute("x",event.clientX-(positionBoxWidth/2));
			_this.onClick.notify(clickPosition);
		});
		
		for (var i = 0; i < data.result[0].length; i++) {
//			console.log(data.result[0][i])
			var width = _this.pixelBase * (data.result[0][i].end - data.result[0][i].start);
			var height = 18;
			var color = _this.colors[data.result[0][i].stain];
			if(color == null) color = "purple";
			var cytoband = data.result[0][i].cytoband;
			var middleX = x+width/2;
			var endY = y+height;
			
			if(data.result[0][i].stain == "acen"){
				var points = "";
				var middleY = y+height/2;
				var endX = x+width;
				if(firstCentromere){
					points = x+","+y+" "+middleX+","+y+" "+endX+","+middleY+" "+middleX+","+endY+" "+x+","+endY;
					firstCentromere = false;
				}else{
					points = x+","+middleY+" "+middleX+","+y+" "+endX+","+y+" "+endX+","+endY+" "+middleX+","+endY;
				}
				SVG.addChild(group,"polyline",{
					"points":points,
					"stroke":"black",
					"opacity":0.8,
					"fill":color
				});
			}else{
				SVG.addChild(group,"rect",{
					"x":x,
					"y":y,
					"width":width,
					"height":height,
					"stroke":"black",
					"opacity":0.8,
					"fill":color
				});
			}
			
			var textY = endY+2;
			var text = SVG.addChild(_this.svg,"text",{
				"x":middleX,
				"y":textY,
				"font-size":10,
				"transform": "rotate(90, "+middleX+", "+textY+")",
				"fill":"black"
			});
			text.textContent = cytoband;
			
			x = x + width;
		}
		
		var positionBoxWidth = _this.tracksViewedRegion*_this.pixelBase;
 		_this.positionBox = SVG.addChild(group,"rect",{
 			"x":pointerPosition-(positionBoxWidth/2),
			"y":2,
			"width":positionBoxWidth,
			"height":_this.height-2,
			"stroke":"orangered",
			"stroke-width":2,
			"opacity":0.3,
 			"fill":"orange"
 		});
 	});
 	cellBaseManager.get("genomic", "region", this.chromosome,"cytoband");
};

ChromosomeWidget.prototype.setLocation = function(item){//item.chromosome, item.position, item.species
	var needDraw = false;
	if(item.species!=null){
		this.species = item.species;
		needDraw = true;
	}
	if(item.chromosome!=null){
		this.chromosome = item.chromosome;
		
		if(this.type == "karyotype" && item.species==null){
			this.positionBox.setAttribute("x1",this.chrOffsetX[this.chromosome]-9);
			this.positionBox.setAttribute("x2",this.chrOffsetX[this.chromosome]+22);
		}else{
			needDraw = true;
		}
	}
	if(item.position!=null){
		this.position = item.position;
		
		if(this.type == "karyotype" && item.species==null){
			var pointerPosition = this.position * this.pixelBase + this.chrOffsetY[this.chromosome];
			this.positionBox.setAttribute("y1",pointerPosition);
			this.positionBox.setAttribute("y2",pointerPosition);
		}else{
			var pointerPosition = this.position*this.pixelBase+20;
			var positionBoxWidth = parseFloat(this.positionBox.getAttribute("width"));
			this.positionBox.setAttribute("x",pointerPosition-(positionBoxWidth/2));
		}
	}
	if(needDraw){
		$(this.svg).empty();
		
		if(this.type == "karyotype"){
			this.drawKaryotype();
		}else{
			this.drawHorizontal();
		}
	}
};

ChromosomeWidget.prototype.setZoom = function(zoom){
	this.zoom=zoom;
	this.tracksViewedRegion = this.width/this._getPixelsbyBase(this.zoom);
	var width = this.tracksViewedRegion*this.pixelBase;
	this.positionBox.setAttribute("width",width);
	var pointerPosition = this.position*this.pixelBase+20;
	this.positionBox.setAttribute("x",pointerPosition-(width/2));
};

ChromosomeWidget.prototype._getPixelsbyBase = function(zoom){
	return this.zoomLevels[zoom];
};

ChromosomeWidget.prototype._createPixelsbyBase = function(){
	this.zoomLevels = new Array();
	var pixelsByBase = 10;
	for ( var i = 100; i >= -40; i-=5) {
		this.zoomLevels[i] = pixelsByBase;
		pixelsByBase = pixelsByBase / 2;
	}
};
