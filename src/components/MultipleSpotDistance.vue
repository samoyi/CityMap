<!--
组件功能
    查询一点到多点的路线
    用于选择距离多点最近的一点，例如多个景点规划时，选择到这些景点都很方便的住宿位置
-->

<template>
    <div>
        <div id="allmap"></div>

        <input type="text" v-model.trim="place" placeholder="出发点地名" />

        <div id="durations">
            <h2>公交耗时</h2>
            <input type="button" value="公交时间" @click="showDurations" />
            <ul>
                <li v-for="(dur, index) of durations" :key="index">{{spots[index].name}}： {{ dur}}</li>
            </ul>
            <p>平均耗时：{{aveDuration}} 分钟</p>
        </div>

        <div id="routes">
            <h2>路线</h2>
            <div>
                公交：
                <input type="button"
                v-for="spot of spots" :key="spot.name"
                :value="'到 ' + spot.name"
                @click="showRoute(spot, 'transit')"
                />
            </div>
            <div>
                步行：
                <input type="button"
                v-for="spot of spots" :key="spot.name"
                :value="'到 ' + spot.name"
                @click="showRoute(spot, 'walking')"
                />
            </div>
            <div id="TransitRoute"></div>
            <div id="WalkingRoute"></div>
        </div>
    </div>
</template>

<script>
import BMap from 'BaiduMap'
import BMapFn from '../modules/BMapFn.class'
let bMapFn = null;

export default {
    data(){
        return {
            city: '',
            map: null, // 地图实例
            place: '', // 起点地名
            spots: [], // 来自数据的地名
            points: [], // 根据地名坐标使用 new BMap.Point 生成的标注点
            durations: [], // 到各个地点的公交耗时字符串
            aveDuration: 0, // 到各个地点的公交平均耗时
            transit: null,
            walking: null,
        };
    },
    computed: {

    },
    methods: {
        // 平均公交耗时
        getAveDuration(){
            const length = this.durations.length;
            const mins = this.durations.map(min=>bMapFn.durationToMinute(min));
            const total = mins.reduce((accu, curr)=>{
                return accu + curr;
            })
            this.aveDuration = Math.round(total / length);
        },

        // 显示到各个终点的耗时
        showDurations(){
            if (!this.place) return;

            // 绘制起点
            bMapFn.getPoint(this.place, (point)=>{
                bMapFn.createLabelPoint(point, '起点：' + this.place);
            }, this.city)

            // 获得起点到其他点的距离
            this.points.forEach((point, index)=>{
                bMapFn.getTransitDuration(this.place, point, (duration)=>{
                    // this.durations.push(`到 ${this.spots[index].name}：${duration}`);
                    this.durations.push(duration);
                });
            });

            setTimeout(()=>{this.getAveDuration()}, 2000);
        },

        //
        showRoute(spot, type){
            if (!this.place) return;

            // 清除之前的路线
            this.transit.clearResults()
            this.walking.clearResults()

            if (type === 'walking'){ // 如果选择步行方式
                // 步行的起终点只能是地名
                // geoc.getLocation 会将坐标点转换为地名
                // http://lbsyun.baidu.com/jsdemo.htm#i7_2
                bMapFn.getLocation(spot.coordinate, (place)=>{
                    this.walking.search(this.place, place);
                });
            }
            else if (type === 'transit') { // 公交
                this.transit.search(this.place, new BMap.Point(...spot.coordinate));
            }
        },
    },
    mounted(){
        const getInit = async ()=>{
            let response = await this.axios.get('http://localhost:3000/init');
            return response.data;
        }
        const getSpots = async ()=>{
            let response = await this.axios.get('http://localhost:3000/spots');
            return response.data.filter(spot=>{
                return spot.cancel === false;
            });
        }


        Promise.all([getInit(), getSpots()]).then(result=>{
            this.city = result[0].city;


            this.spots = result[1];
            this.points = this.spots.map(spot=>{
                return new BMap.Point(...spot.coordinate);
            });

            // 初始
            const map = new BMap.Map("allmap");
            bMapFn = new BMapFn(map);
            this.map = map;
            const center = new BMap.Point(121.485858, 31.284386);
            map.centerAndZoom(center, 12);


            // 控件
            // http://lbsyun.baidu.com/jsdemo.htm#f0_4
            map.enableScrollWheelZoom();   //启用滚轮放大缩小，默认禁用


            // 绘制所有的标注点
            this.spots.forEach(spot=>{
                // createPoint(spot);
                const point = new BMap.Point(...spot.coordinate)
                bMapFn.createLabelPoint(point, spot.name);
            })


            // 生成公交和步行的路线实例，这两个实例都会接受起终点信息，生成路线
            // http://lbsyun.baidu.com/jsdemo.htm#i6_1
            this.transit = new BMap.TransitRoute(this.map, {
                renderOptions: {
                    map: this.map,
                    panel: "TransitRoute",
                },
            });
            // http://lbsyun.baidu.com/jsdemo.htm#i4_7
            this.walking = new BMap.WalkingRoute(this.map, {
                renderOptions: {
                    map: this.map,
                    panel: "WalkingRoute",
                }
            });
        });
    },
}
</script>

<style scoped lang="scss">
    body, html, #allmap {
        width: 100%;
        height: 650px;
        overflow: hidden;
        margin-top: -100px;
        font-family:"微软雅黑";
    }

    #durations, #routes{
        width: 600px;
        margin: 0 auto;
        border: 1px solid;
    }

</style>
