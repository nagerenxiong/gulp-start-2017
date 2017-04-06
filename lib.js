'use strict';
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var gutil = require('gulp-util');
var through = require('through2');
var image = require("imageinfo");

function readFileList(path, filesList) {
	var files = fs.readdirSync(path);
	files.forEach(function(itm, index) {
		var stat = fs.statSync(path + itm);
		if (stat.isDirectory()) {
			//递归读取文件
			readFileList(path + itm + "/", filesList)
		} else {

			var obj = {}; //定义一个对象存放文件的路径和名字
			obj.path = path; //路径
			obj.filename = itm //名字
			filesList.push(obj);
		}

	})

}



function readFile(pathg,array1,index,type,resultArray,callback) {
	if(index>=array1.length){callback(resultArray,type); return;}
	var file=array1[index]["path"]+array1[index]["filename"];
	// readFile的第2个参数表示读取编码格式，如果未传递这个参数，表示返回Buffer字节数组  
	fs.readFile(file, "utf8", function(err, data) {
		if (err){
			console.log("读取文件fail " + err);
		}
		else {
			var dPathIndex=pathg.indexOf("component");
			var dPath=pathg.substring(dPathIndex);
			dPath=dPath.replace(/\\/g,"/");
			dPath=dPath.replace(/.scss/g,"");
			if(data.indexOf(dPath)>0){
				resultArray.push(file);
			}
			index++;
			readFile(pathg,array1,index,type,resultArray,callback);
		}
	});
}

var getFiles = {
	//获取文件夹下的所有文件
	getFileList: function(path) {
		var filesList = [];
		readFileList(path, filesList);
		return filesList;
	},
	//获取文件夹下的所有图片
	getImageFiles: function(path) {
		var imageList = [];

		this.getFileList(path).forEach((item) => {
			var ms = image(fs.readFileSync(item.path + item.filename));

			ms.mimeType && (imageList.push(item.filename))
		});
		return imageList;

	}
};



exports.compile=function(path, callback) {
	var array1 = [];
	var array2=[];
	var i = path.lastIndexOf(".");
	var type = path.substring(i + 1);
	array1 = getFiles.getFileList("./src/page/");
	array2 =getFiles.getFileList("./src/css/");
	var resultArray=[];
	var index=0;
	if (type == "html") {
		readFile(path,array1,index,0,resultArray,callback);
	} else if("scss"){
		readFile(path,array2,index,1,resultArray,callback);
	}
};

exports.imgfilter=function(path, path1,callback) {
	var array1 = getFiles.getFileList(path);
	var array2 = getFiles.getFileList(path1);
	var result = [];
	var result1 = [];
	for (var i = 0; i < array2.length; i++) {
		var obj = array2[i];
		var num = obj.filename;
		var isExist = false;
		for (var j = 0; j < array1.length; j++) {
			var aj = array1[j];
			var n = aj.filename;
			if (n == num) {
				isExist = true;
				break;
			}
		}
		if (!isExist) {
			result.push(obj);
		}
	}
	for (var i = 0; i < array1.length; i++) {
		var obj = array1[i];
		var num = obj.filename;
		var isExist = false;
		for (var j = 0; j < array2.length; j++) {
			var aj = array2[j];
			var n = aj.filename;
			if (n == num) {
				isExist = true;
				break;
			}
		}
		if (!isExist) {
			result1.push(obj);
		}
	}
	callback(result,result1);
};

