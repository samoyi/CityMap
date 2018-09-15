import BMap from 'BaiduMap'

export default class BMapFn{
    // 参数为地图实例，由 new BMap.Map 所创建
    constructor(map){
        this.map = map;
        this.geocoder = new BMap.Geocoder(); // 地址解析器
    }


    // 解析地址
    // http://lbsyun.baidu.com/jsdemo.htm#i7_1
    /*
     * @param {strig}     address   地址字符串
     * @param {function}  callback  解析后的回调，参数为解析获得的 point
     * @param {strig}     city      城市名
     */
    getPoint(address, callback, city){
        // 将地址解析结果显示在地图上,并调整地图视野
        this.geocoder.getPoint(address, function(point){
            callback(point);
        }, city);
    }


    // 逆地址解析 根据坐标获得地址文字
    // http://lbsyun.baidu.com/jsdemo.htm#i7_2
    /*
     * @param {array}    coordinate   经度和纬度数值组成的两项数组
     * @param {function} callback     解析完成的回调，接受参数为地址字符串
     */
    getLocation(coordinate, callback){
        const geoc = new BMap.Geocoder();
        this.geocoder.getLocation(new BMap.Point(...coordinate), (rs)=>{
            const addComp = rs.addressComponents;
            const place = addComp.province + ", "
            + addComp.city + ", "
            + addComp.district + ", "
            + addComp.street + ", "
            + addComp.streetNumber;
            callback(place);
        });
    }


    // 用来创建带名称的标注点
    // http://lbsyun.baidu.com/jsdemo.htm#c2_3
    /*
     * @param {object}  point   标注点对象  由 new BMap.Point 生成
     * @param {strig}   name    标注名称
     */
    createLabelPoint(point, name){
        // const point = new BMap.Point(...coordinate)
        const marker = new BMap.Marker(point);  // 创建标注
        this.map.addOverlay(marker);              // 将标注添加到地图中
        const label = new BMap.Label(name, {offset:new BMap.Size(20,-10)});
        marker.setLabel(label);
    }


    // 获得公交用时
    // http://lbsyun.baidu.com/jsdemo.htm#i4_6
    /*
     * @param {string}   start    起点地名
     * @param {string}   end      终点地名
     * @param {function} callback 获得时间后的回调，参数为时间字符串
     */
    getTransitDuration(start, end, callback){
        let output = '';

        function searchComplete(results){
    		if (transit.getStatus() != BMAP_STATUS_SUCCESS){
    			return ;
    		}
			const plan = results.getPlan(0);
			output += plan.getDuration(true);  //获取时间

    	}
    	const transit = new BMap.TransitRoute(this.map, {
            renderOptions: {map: this.map},
    		onSearchComplete: searchComplete,
    		onPolylinesSet(){
                transit.clearResults(); // 直接删除路线，这里不需要显示，只要获得时间
                callback(output);
    		}});
    	transit.search(start, end);
    }


    // 用时字符串转换为分钟数值
    // 地图接口返回的用时字符串类似于 "1小时30分钟"，通过该方法可以返回"90"
    durationToMinute(str){
        let hourIndex = str.indexOf('小时');
        let minIndex = str.indexOf('分钟');

        let minute = 0;
        if (hourIndex !== -1){
            minute += Number.parseInt(str.slice(0, hourIndex)) * 60;
            if (minIndex !== -1){
                minute += Number.parseInt(str.slice(hourIndex+2, minIndex));
            }
        }
        else {
            minute += Number.parseInt(str.slice(0, minIndex));
        }

        return minute;
    }
}
