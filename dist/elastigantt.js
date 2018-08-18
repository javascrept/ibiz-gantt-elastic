var ElastiganttApp = (function (exports) {
  'use strict';

  function Calendar(prefix, self) {
    return self.wrapComponent({
      template : `<g class="elastigantt__calendar-group">
      <rect
        class="elastigantt__calendar"
        :x="getX"
        :y="getY"
        :width="getWidth"
        :height="$root.$data.calendar.height"
        :style="$root.$data.calendar.style"
      ></rect>
      <${prefix}-calendar-row
        v-for="(month,index) in months"
        :key="month.key"
        :item="month"
      ></${prefix}-calendar-row>
      <${prefix}-calendar-row
        v-for="(day,index) in days"
        :key="day.key"
        :item="day"
      ></${prefix}-calendar-row>
      <${prefix}-calendar-row
        v-for="(hour,index) in hours"
        :key="hour.key"
        :item="hour"
      ></${prefix}-calendar-row>
    </g>`,
      data() {
        return {cache : {}};
      },
      methods : {
        howManyHoursFit(current = 24, currentRecurrection = 1) {
          let max       = {short : 0, medium : 0, long : 0};
          const state   = this.$root.$data;
          self.ctx.font = state.calendar.day.fontSize + ' ' + state.calendar.fontFamily;
          let firstDate = dayjs(state.times.firstDate);
          for (let i = 0; i < current; i++) {
            let currentDate = firstDate.add(i, 'hours').toDate();
            let textWidth   = {
              short : self.ctx.measureText(state.calendar.hour.format.short(currentDate)).width,
              medium : self.ctx.measureText(state.calendar.hour.format.medium(currentDate)).width,
              long : self.ctx.measureText(state.calendar.hour.format.long(currentDate)).width,
            };
            if (textWidth.short >= max.short) {
              max.short = textWidth.short;
            }
            if (textWidth.medium >= max.medium) {
              max.medium = textWidth.medium;
            }
            if (textWidth.long >= max.long) {
              max.long = textWidth.long;
            }
          }
          let cellWidth = state.times.stepPx / current - state.calendar.strokeWidth - 2;
          if (current > 1) {
            if (max.short > cellWidth) {
              currentRecurrection++;
              return this.howManyHoursFit(Math.ceil(current / currentRecurrection), currentRecurrection);
            }
          }
          if (currentRecurrection < 3) {
            if (max.long <= cellWidth) {
              return {count : current, type : 'long'};
            }
            if (max.medium <= cellWidth) {
              return {count : current, type : 'medium'};
            }
          }
          if (max.short <= cellWidth && current > 1) {
            return {count : current, type : 'short'};
          }
          return {count : 0, type : 'short'};
        },
        howManyDaysFit(current = this.$root.$data.times.steps, currentRecurrection = 1) {
          let max       = {short : 0, medium : 0, long : 0};
          const state   = this.$root.$data;
          self.ctx.font = state.calendar.day.fontSize + ' ' + state.calendar.fontFamily;
          let firstDate = dayjs(state.times.firstDate);
          for (let i = 0; i < current; i++) {
            let currentDate = firstDate.add(i, 'days').toDate();
            let textWidth   = {
              short : self.ctx.measureText(state.calendar.day.format.short(currentDate)).width,
              medium : self.ctx.measureText(state.calendar.day.format.medium(currentDate)).width,
              long : self.ctx.measureText(state.calendar.day.format.long(currentDate)).width,
            };
            if (textWidth.short >= max.short) {
              max.short = textWidth.short;
            }
            if (textWidth.medium >= max.medium) {
              max.medium = textWidth.medium;
            }
            if (textWidth.long >= max.long) {
              max.long = textWidth.long;
            }
          }
          let cellWidth = state.times.totalViewDurationPx / current - state.calendar.strokeWidth - 2;
          if (current > 1) {
            if (max.short > cellWidth) {
              currentRecurrection++;
              return this.howManyDaysFit(Math.ceil(current / currentRecurrection), currentRecurrection);
            }
          }
          if (max.long <= cellWidth) {
            return {count : current, type : 'long'};
          }
          if (max.medium <= cellWidth) {
            return {count : current, type : 'medium'};
          }
          if (max.short <= cellWidth && current > 1) {
            return {count : current, type : 'short'};
          }
          return {cunt : 0, type : 'short'};
        },
        hourTextStyle() {
          return 'font-family:' + this.$root.$data.calendar.hour.fontFamily +
                 ';font-size:' + this.$root.$data.calendar.hour.fontSize;
        },
        dayTextStyle() {
          return 'font-family:' + this.$root.$data.calendar.day.fontFamily +
                 ';font-size:' + this.$root.$data.calendar.day.fontSize;
        },
      },
      computed : {
        getX() {
          return this.$root.$data.calendar.strokeWidth / 2;
        },
        getY() {
          return this.$root.$data.calendar.strokeWidth / 2;
        },
        getWidth() {
          return this.$root.$data.width - this.$root.$data.calendar.strokeWidth;
        },

        hours() {
          let hours      = [];
          let hoursCount = this.howManyHoursFit();
          let hourStep   = 24 / hoursCount.count;
          let state      = this.$root.$data;
          for (let i = 0, len = state.times.steps * hoursCount.count; i < len; i++) {
            const date = new Date(state.times.firstTime + i * hourStep * 60 * 60 * 1000);
            hours.push({
              key : 'h' + i,
              x : state.calendar.strokeWidth / 2 + i * state.times.stepPx / hoursCount.count,
              y : state.calendar.strokeWidth / 2 + state.calendar.day.height + state.calendar.month.height,
              width : state.times.stepPx / hoursCount.count,
              height : state.calendar.hour.height,
              label : state.calendar.hour.format[hoursCount.type](date)
            });
          }
          return state.calendar.hours = hours;
        },
        days() {
          let state     = this.$root.$data;
          let days      = [];
          let daysCount = this.howManyDaysFit();
          let dayStep   = state.times.steps / daysCount.count;
          for (let i = 0, len = daysCount.count; i < len; i++) {
            const date = new Date(state.times.firstTime + i * dayStep * 24 * 60 * 60 * 1000);
            days.push({
              key : 'd' + i,
              x : state.calendar.strokeWidth / 2 + i * state.times.totalViewDurationPx / daysCount.count,
              y : state.calendar.strokeWidth / 2 + state.calendar.month.height,
              width : state.times.totalViewDurationPx / daysCount.count,
              height : state.calendar.day.height,
              label : state.calendar.day.format[daysCount.type](date)
            });
          }
          return state.calendar.days = days;
        },
        months() {
          let state          = this.$root.$data;
          let months         = [];
          let firstDate      = state.times.firstDate;
          let lastDate       = state.times.lastDate;
          let steps          = state.times.steps;
          let currentDate    = dayjs(state.times.firstDate);
          let currentMonth   = currentDate.month();
          let currentDays    = 0;
          let monthDays      = [];
          let currentDateObj = {date : currentDate.clone().toDate(), days : 0};
          for (let i = 0; i < steps; i++) {
            currentDays++;
            currentDate = currentDate.clone().add(1, 'days');
            if (currentDate.month() !== currentMonth) {
              currentMonth        = currentDate.month();
              currentDateObj.days = currentDays;
              monthDays.push(currentDateObj);
              currentDateObj = {date : currentDate.clone().toDate(), days : 0};
              currentDays    = 0;
            }
          }
          if (currentDays) {
            currentDateObj.days = currentDays;
            monthDays.push(currentDateObj);
          }
          let currentOffset = state.calendar.strokeWidth / 2;
          for (let i = 0, len = monthDays.length; i < len; i++) {
            let days   = monthDays[i].days;
            let date   = monthDays[i].date;
            let width  = state.times.stepPx * days;
            let format = 'long';
            if (self.ctx.measureText(state.calendar.month.format[format](date)).width > width) {
              format = 'medium';
              if (self.ctx.measureText(state.calendar.month.format[format](date)).width > width) {
                format = 'short';
              }
            }          months.push({
              key : 'm' + i,
              x : currentOffset,
              y : state.calendar.strokeWidth / 2,
              width : width,
              height : state.calendar.day.height,
              label : state.calendar.month.format[format](date)
            });
            currentOffset += width;
          }
          return state.calendar.months = months;
        }
      }
    });
  }

  function CalendarRow(prefix, self) {
    return self.wrapComponent({
      props:['item'],
      template: `<g class="elastigantt__calendar-row-group">
    <rect
      class="elastigantt__calendar-row"
      :x="item.x"
      :y="item.y"
      :width="item.width"
      :height="item.height"
    ></rect>
    <text
      :x="getTextX"
      :y="getTextY"
      alignment-baseline="middle"
      text-anchor="middle"
    >{{item.label}}</text>
    </g>`,
      data() {
        return {};
      },
      computed:{
        getTextX(){
          return this.item.x+this.item.width/2;
        },
        getTextY(){
          return this.item.y+this.item.height/2;
        },
      }
    });
  }

  const Elastigantt = Vue.component("Elastigantt", {
    template: `<div class="elastigantt">
    <elastigantt-main></elastigantt-main>
  </div>`,
    data() {
      return window.elastiganttStore.initStore(prefix, 'Elastigantt', {});
    },
    methods: {

    }
  });

  function Grid(prefix, self) {
    return self.wrapComponent({

      template : `<g>
        <line
          class="elastigantt__grid-vertical-line"
          v-for="(line,index) in horizontalLines"
          :key="line.key"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
        ></line>
        <line
          class="elastigantt__grid-horizontal-line"
          v-for="(line,index) in verticalLines"
          :key="line.key"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
        ></line>
      </g>`,

      data() {
        return {};
      },
      computed : {
        verticalLines() {
          let lines   = [];
          const state = this.$root.$data;
          for (let step = 0; step <= state.times.steps; step++) {
            let x = step * state.times.stepPx + state.verticalGrid.strokeWidth / 2;
            lines.push({
              key : step,
              x1 : x,
              y1 : state.calendar.height + state.calendar.strokeWidth + state.calendar.gap,
              x2 : x,
              y2 : state.calendar.height + state.calendar.strokeWidth + state.calendar.gap +
                       (state.tasks.length * (state.row.height + state.horizontalGrid.gap * 2)) +
                       state.horizontalGrid.strokeWidth,
            });
          }
          return state.verticalGrid.lines = lines;
        },
        horizontalLines() {
          let lines   = [];
          const state = this.$root.$data;
          let tasks   = state.tasks;
          for (let index = 0, len = tasks.length; index <= len; index++) {
            lines.push({
              key : 'hl' + index,
              x1 : 0,
              y1 : index * (state.row.height + state.horizontalGrid.gap * 2) + state.calendar.height +
                       state.calendar.strokeWidth + state.calendar.gap + state.horizontalGrid.strokeWidth / 2,
              x2 : state.times.steps * state.times.stepPx + state.verticalGrid.strokeWidth,
              y2 : index * (state.row.height + state.horizontalGrid.gap * 2) + state.calendar.height +
                       state.calendar.strokeWidth + state.calendar.gap + state.horizontalGrid.strokeWidth / 2,
            });
          }
          return state.horizontalGrid.lines = lines;
        }
      }
    });
  }

  function GridHeader(prefix, self) {
    return self.wrapComponent({

      template: `<g></g>`,

      data() {
        return {};
      },

      computed: {

      }
    });
  }

  function Header(prefix, self) {
    return self.wrapComponent({

      template : `<div class="elastigantt__header">
          <input type="range" v-model="scale" max="24" min="2">
          <input type="range" v-model="height" max="100" min="6">
          <input type="range" v-model="scope" max="100" min="0">
          <input type="range" v-model="divider" max="100" min="0">
          <input type="checkbox" v-model="$root.$data.taskList.display">
      </div>`,

      data() {
        return {};
      },

      computed : {
        scale : {
          get() {
            return this.$root.$data.times.timeZoom;
          },
          set(value) {
            this.$root.$data.times.timeZoom = Number(value);
            this.$root.recalculate();
          }
        },
        height : {
          get() {
            return this.$root.$data.row.height;
          },
          set(value) {
            this.$root.$data.row.height = Number(value);
            this.$root.recalculate();
          }
        },
        scope : {
          get() {
            return this.$root.$data.scope.before;
          },
          set(value) {
            this.$root.$data.scope.before = Number(value);
            this.$root.$data.scope.after  = Number(value);
            this.$root.recalculate();
          }
        },
        divider : {
          get() {
            return this.$root.$data.taskList.percent;
          },
          set(value) {
            this.$root.$data.taskList.percent = Number(value);
            this.$root.recalculate();
          }
        },
      }
    });
  }

  function Main(prefix, self) {
    return self.wrapComponent({
      template : `
    <div class="elastigantt__main">
      <${prefix}-header></${prefix}-header>
      <div class="elastigantt__container">
        <div class="elastigantt__task-list-container">
          <svg ref="svgTaskList" class="elastigantt__task-list-svg" xmlns="http://www.w3.org/2000/svg"
            :width="$root.$data.taskList.finalWidth+'px'"
            :height="$root.$data.height"
            v-if="$root.$data.taskList.display"
          >
            <defs v-html="defs"></defs>
            <${prefix}-task-list></${prefix}-task-list>
          </svg>
        </div>
        <div class="elastigantt__main-svg-container">
          <svg ref="svgElement" class="elastigantt__main-container" xmlns="http://www.w3.org/2000/svg"
            :width="getWidth"
            :height="$root.$data.height">
            <defs v-html="defs"></defs>
            <${prefix}-tree></${prefix}-tree>
          </svg>
        </div>
      </div>
    </div>`,
      data() {
        return {
          defs : '',
        };
      },
      created() {
        let css = '';
        try {
          for (let i = 0, len = document.styleSheets.length; i < len; i++) {
            let styleSheet = document.styleSheets[i];
            if (styleSheet.title === 'elastigantt__style') {
              for (let r = 0, rules = styleSheet.rules.length; r < rules; r++) {
                let rule = styleSheet.rules[r];
                css += rule.cssText + "\n";
              }
              break;
            }
          }
          css       = "<![CDATA[\n" + css + "]]>";
          this.defs = `<style type="text/css">${css}</style>`;
        } catch (e) {
          console.log("Cannot add stylesheet to SVG.");
        }
        this.$root.$data.defs.forEach((def) => {
          this.defs += def;
        });
      },
      mounted() {
        this.$root.svgElement = this.$refs.svgElement;
      },
      computed : {
        getWidth() {
          return this.$root.$data.width;
        },
        getMainStyle() {
          const state = this.$root.$data;
          return {width : state.width + 'px'};
        }
      }
    })
  }

  function TaskListResizer(prefix, self) {
    return self.wrapComponent({
      template : `<div class="elastigantt__task-list-resizer" style="getStyle"></div>`,
      data() {
        return {};
      },
      computed : {
        getStyle() {
          const state = this.$root.$data;
          return {height : '100%', width : state.taskList.resizerWidth + 'px'};
        }
      }
    });
  }

  function TaskList(prefix, self) {
    return self.wrapComponent({
      template : `<foreignObject class="elastigantt__task-list-object"
      x="0"
      y="0"
      width="100%"
      height="100%"
      v-if="$root.$data.taskList.display"
      >
      <div  xmlns="http://www.w3.org/1999/xhtml" class="elastigantt__task-list-container">
        <${prefix}-task-list-resizer></${prefix}-task-list-resizer>
        <${prefix}-task-list-header></${prefix}-task-list-header>
        <${prefix}-task-list-item
          v-for="task in $root.$data.tasks"
          :key="task.id"
          :task="task"
        ></${prefix}-task-list-item>
      </div>
    </foreignObject>`,
      data() {
        return {};
      },
    });
  }

  function TaskListHeader(prefix, self) {
    return self.wrapComponent({
      template : `<div class="elastigantt__task-list-header">
      <div class="elastigantt__task-list-header-column"
        v-for="column in $root.$data.taskList.columns"
        :key="column.label"
        :style="getStyle"
      >
      <div class="elastigantt__task-list-header-label" :column="column" :style="{width: column.finalWidth+'px'}">{{column.label}}</div>
      <div class="elastigantt__task-list-header-resizer"></div>
      </div>
    </div>`,
      data() {
        return {};
      },
      computed : {
        getStyle() {
          const state = this.$root.$data;
          return {
            'height': (state.calendar.height + state.calendar.strokeWidth) + 'px',
                'margin-bottom': state.calendar.gap + 'px'
          }
        }
      }
    });
  }

  function TaskListItem(prefix, self) {
    return self.wrapComponent({
      props : [ 'task' ],
      template : `<div class="elastigantt__task-list-item">
      <div class="elastigantt__task-list-item-column"
      v-for="column in $root.$data.taskList.columns"
      :key="column.label"
      :style="getStyle"
      >
        <div class="elastigantt__task-list-item-value" :style="{width:column.finalWidth}">{{task[column.value]}}</div>
      </div>
    </div>`,
      data() {
        return {};
      },
      computed : {
        getStyle() {
          const state = this.$root.$data;
          let height  = state.row.height + (state.horizontalGrid.gap * 2) - state.horizontalGrid.strokeWidth;
          return {'height' : height + 'px', 'line-height' : height + 'px'};
        },
        getContent(column) {
          return this.task[column.value];
        }
      }
    });
  }

  function TreeBar(prefix, self) {
    return self.wrapComponent({
      props : [ 'task' ],
      template : `<rect id="elastigantt__tree-row" x="0" y="0" width="100%" height="100%" style="fill:#FF0000a0"></rect>`,
      data() { return {}; },
    });
  }

  function Info(prefix, self) {
    return self.wrapComponent({
      props : [ 'task' ],
      template : `
      <svg class="elastigantt__info"
        :x="task.x+task.width+10"
        :y="task.y"
        :width="getWidth"
        :height="$root.$data.row.height"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="4" y="0" width="100%" height="100%" :style="$root.$data.info.style"></rect>
        <text x="10" y="50%" :style="getTextStyle" alignment-baseline="middle">{{task.label}}</text>
      </svg>
    `,
      data() {
        return {};
      },
      computed : {
        getWidth() {
          return self.ctx.measureText(this.task.label).width + 20;
        },
        getTextStyle() {
          let state = this.$root.$data;
          return `${state.info.textStyle};font-family:${state.info.fontFamily};font-size:${
            state.info.fontSize};font-weight:bold;`;
        }
      }
    });
  }

  function TreeProgressBar(prefix, self) {
    return self.wrapComponent({
      props:['task'],
      template:`<rect id="elastigantt__tree-row-progress" x="0" y="0" height="25%" :width="getProgressWidth" style="fill:#00ff92a0"></rect>`,
      data(){
        return {};
      },
      computed:{
        getProgressWidth(){
          return this.task.progress+'%';
        },
      }
    });
  }

  function TreeText(prefix, self) {
    return self.wrapComponent({
      props:['task'],
      template:`<text x="2" y="50%" :style="getTextStyle" alignment-baseline="middle">{{task.label}}</text>`,
      data(){
        return {};
      },
      computed:{
        getTextStyle(){
          let state = this.$root.$data;
          return `${state.row.textStyle};font-family:${state.row.fontFamily};font-size:${state.row.fontSize};font-weight:bold;`;
        }
      }
    });
  }

  function Tree(prefix, self) {
    return self.wrapComponent({
      template : `
      <svg class="elastigantt_tree-object"
        x="0"
        y="0"
        :width="getWidth"
        :height="getHeight"
        xmlns="http://www.w3.org/2000/svg"
      >
        <${prefix}-calendar></${prefix}-calendar>
        <${prefix}-grid></${prefix}-grid>
        <${prefix}-tree-row
          v-for="(task, index) in $root.$data.tasks"
          :task="task"
          :index="index"
          :key="task.id"
        ></${prefix}-tree-row>
      </svg>`,
      data() {
        return {};
      },
      computed : {
        getWidth() {
          const state = this.$root.$data;
          return state.width;
        },
        getHeight() {
          const state = this.$root.$data;
          return state.height;
        }
      }
    });
  }

  function TreeRow(prefix, self) {
    return self.wrapComponent({
      props : [ 'task', 'index' ],
      template : `<g class="elastigantt__tree-row-group" @mouseover="treeRowMouseOver" @mouseout="treeRowMouseOut">
      <svg class="elastigantt__tree-row"
        :x="task.x"
        :y="task.y"
        :width="task.width"
        :height="task.height"
        @click="treeRowClick"
        xmlns="http://www.w3.org/2000/svg"
      >
        <${prefix}-tree-bar :task="task"></${prefix}-tree-bar>
        <${prefix}-tree-progress-bar :task="task"></${prefix}-tree-progress-bar>
        <${prefix}-tree-text :task="task" v-if="$root.$data.row.showText"></${prefix}-tree-text>
      </svg>
      <${prefix}-info :task="task" v-if="task.mouseOver"></${prefix}-info>
    </g>`,
      data() {
        return {};
      },
      computed : {
        getViewBox() {
          return `0 0 ${this.task.width} ${this.task.height}`;
        },
        getGroupTransform() {
          return `translate(${this.task.x} ${this.task.y})`;
        },
      },
      methods : {
        treeRowClick() {
          this.task.tooltip.visible = !this.task.tooltip.visible;
        },
        treeRowMouseOver() {
          this.task.mouseOver = true;
        },
        treeRowMouseOut() {
          this.task.mouseOver = false;
        },
      }
    });
  }

  const elastiganttStore = function elastiganttStore(debug) {
    function stateHandler(fullPath) {
      return {
        get(target, name) {
          let value = target[name];
          if (debug && name !== '_isProxy' && name !== '__ob__') {
            if (!(typeof value === 'object' && typeof value._isProxy !== 'undefined')) {
              let log = 'GET: ' + fullPath + '.' + name.toString();
              console.groupCollapsed(log);
              console.log('VALUE:', value);
              console.trace();
              console.groupEnd();
            }
          }
          return target[name];
        },
        set(target, name, value) {
          let oldValue = target[name];
          if (debug) {
            if (!(typeof oldValue === 'object' && typeof oldValue._isProxy !== 'undefined')) {
              let log = 'SET: ' + fullPath + '.' + name.toString();
              console.groupCollapsed(log);
              console.log('VALUE:', value);
              console.trace();
              console.groupEnd();
            }
          }
          if (typeof value === 'object' && !Array.isArray(value)) {
            value._isProxy = true;
            target[name] = new Proxy(value, stateHandler(fullPath + '.' + name));
          } else {
            target[name] = value;
          }
          return true;
        },
        deleteProperty(target, name) {
          let oldValue = target[name];
          if (debug) {
            if (!(typeof target[name] === 'object' && typeof target[name]._isProxy !== 'undefined')) {
              let log = 'DEL: ' + fullPath + '.' + name.toString();
              console.groupCollapsed(log);
              console.log('OLDVAL:', oldValue);
              console.trace();
              console.groupEnd();
            }
          }
          delete target[name];
          return true;
        }
      }
    }

    let globalState = {};
    let instancesStates = {};
    let componentsStates = {};
    if (debug) {
      globalState = new Proxy({}, stateHandler('root'));
      instancesStates = new Proxy({}, stateHandler('root'));
      componentsStates = new Proxy({}, stateHandler('root'));
    }

    let lastId = {};

    return {

      saveGlobalState(obj, current = globalState) {
        for (let key in obj) {
          globalState[key] = obj[key];
        }
      },

      getGlobalState(prop) {
        if (prop) {
          return globalState[prop];
        }
        return globalState;
      },

      getInstanceState(prefix) {
        if (prefix) {
          return instancesStates[prefix];
        }
        return instancesStates;
      },

      getComponentState(prefix, componentId) {
        if (prefix) {
          if (componentId) {
            return componentsStates[prefix][componentId];
          }
          return componentsStates[prefix];
        }
        return componentsStates;
      },

      initStore(prefix, componentName) {
        if (typeof lastId[prefix] === 'undefined') {
          lastId[prefix] = 0;
        }
        const componentId = lastId[prefix]++;
        if (typeof componentsStates[prefix] === 'undefined') {
          componentsStates[prefix] = {};
        }
        if (debug) {
          return componentsStates[prefix][componentId] = new Proxy(globalState, stateHandler(`${componentName}[${componentId}]`));
        }
        return componentsStates[prefix][componentId] = globalState;
      },

    };
  };

  // elastigantt components

  class ElastiganttApp {
    toPascalCase(str) {
      return str
          .replace(/(\w)(\w*)/g,
                   function(g0, g1, g2) {
                     return g1.toUpperCase() + g2.toLowerCase();
                   })
          .replace(/\-/g, '');
    }

    toKebabCase(str) {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    }

    getComponents(prefix, kebabCase = true) {
      let self = this;

      let components = {
        'task-list-resizer' : TaskListResizer(prefix, self),
        'task-list-header' : TaskListHeader(prefix, self),
        'task-list-item' : TaskListItem(prefix, self),
        'task-list' : TaskList(prefix, self),
        'main' : Main(prefix, self),
        'tree' : Tree(prefix, self),
        'header' : Header(prefix, self),
        'grid' : Grid(prefix, self),
        'grid-header' : GridHeader(prefix, self),
        'tree-row' : TreeRow(prefix, self),
        'tree-text' : TreeText(prefix, self),
        'tree-bar' : TreeBar(prefix, self),
        'tree-progress-bar' : TreeProgressBar(prefix, self),
        'info' : Info(prefix, self),
        'calendar' : Calendar(prefix, self),
        'calendar-row' : CalendarRow(prefix, self),
      };

      let customComponents = {};
      for (let componentName in components) {
        let component = components[componentName];
        // shallow extend
        if (typeof this.customComponents[componentName] !== 'undefined') {
          component = {...component, ...this.customComponents[componentName]};
        }
        customComponents[this.toPascalCase(prefix + '-' + componentName)] = component;
      }

      if (kebabCase) {
        let kebabComponents = {};
        for (let name in customComponents) {
          let value                               = customComponents[name];
          kebabComponents[this.toKebabCase(name)] = value;
        }
        return kebabComponents;
      }

      return customComponents;
    }

    registerComponents() {
      const components = this.getComponents(this.prefix, true);
      for (let componentName in components) {
        let component                    = components[componentName];
        let currentInstanceComponentName = componentName;
        Vue.component(currentInstanceComponentName, component);
      }
    }

    wrapComponent(props) {
      return props;
    }

    getDefaultOptions(userOptions) {
      return {
        debug : false,
        width : 0,
        height : 0,
        svgElement : null,
        scope : {
          before : 5,
          after : 5,
        },
        times : {
          timeScale : 60 * 1000,
          timeZoom : 18,
          timePerPixel : 0,
          fistDate : null,
          firstTime : null, // firstDate getTime()
          lastDate : null,
          lastTime : null, // last date getTime()
          totalViewDurationMs : 0,
          totalViewDurationPx : 0,
          stepMs : 24 * 60 * 60 * 1000,
          stepPx : 0,
          steps : 0,
        },
        row : {
          height : 24,
          style : 'fill:#FF0000a0',
          textStyle : 'fill:#ffffff',
          fontFamily : 'sans-serif',
          fontSize : '12px',
          showText : false,
        },
        progress : {
          height : 6,
          style : 'fill:#00ff92a0',
        },
        horizontalGrid : {
          gap : 6,
          strokeWidth : 1,
          style : "stroke:#00000050;strokeWidth:1",
          lines : [],
        },
        verticalGrid : {
          strokeWidth : 1,
          style : "stroke:#00000050;strokeWidth:1",
          lines : [],
        },
        info : {style : 'fill:#000000f0', textStyle : 'fill:#fff', fontFamily : 'sans-serif', fontSize : '12px'},
        taskList : {
          display : true,
          columns : [ {label : 'Zadanie', value : 'label', width : 100} ],
          resizerWidth : 0,
          percent : 100,
          width : 0,
          finalWidth : 0
        },
        calendar : {
          hours : [],
          days : [],
          months : [],
          gap : 6,
          height : 0,
          strokeWidth : 1,
          fontFamily : 'sans-serif',
          style : "fill:#00000020;stroke:#00000000;strokeWidth:1",
          hour : {
            height : 20,
            display : true,
            fontSize : '12px',
            format : {
              short(date) {
                return dayjs(date).locale('pl').format('HH');
              },
              medium(date) {
                return dayjs(date).locale('pl').format('HH:mm');
              },
              long(date) {
                return dayjs(date).locale('pl').format('HH:mm');
              }
            }
          },
          day : {
            height : 20,
            display : true,
            fontSize : '12px',
            format : {
              short(date) {
                return dayjs(date).locale('pl').format('DD');
              },
              medium(date) {
                return dayjs(date).locale('pl').format('DD ddd');
              },
              long(date) {
                return dayjs(date).locale('pl').format('DD dddd');
              }
            }
          },
          month : {
            height : 20,
            display : true,
            fontSize : '12px',
            format : {
              short(date) {
                return dayjs(date).locale('pl').format('MM');
              },
              medium(date) {
                return dayjs(date).locale('pl').format('\'YY MMM');
              },
              long(date) {
                return dayjs(date).locale('pl').format('YYYY MMMM (MM)');
              }
            }
          },
        },
        defs : []
      };
    }

    constructor(prefix, containerId, data, options = {}, customComponents = {}) {
      const self = this;
      if (typeof window.elastiganttStore === 'undefined') {
        window.elastiganttStore = elastiganttStore(options.debug, options.showStack);
      }

      if (containerId.substr(0, 1) === '#') {
        containerId = containerId.substr(1);
      }
      this.containerId      = containerId;
      this.containerElement = document.getElementById(containerId);
      this.prefix           = prefix.replace(/[^a-z0-9]/gi, '');
      this.prefixPascal     = this.toPascalCase(this.prefix);
      dayjs.locale(options.locale, null, true);
      this.data                     = data;
      this.tasks                    = data.tasks;
      this.options                  = Object.assign(this.getDefaultOptions(options), options);
      this.options.taskList.columns = this.options.taskList.columns.map(column => {
        column.finalWidth = column.width / 100 * this.options.taskList.percent;
        return column;
      });

      // initialize observer
      this.tasks = this.tasks.map((task) => {
        task.x         = 0;
        task.y         = 0;
        task.width     = 0;
        task.height    = 0;
        task.tooltip   = {visible : false};
        task.mouseOver = false;
        return task;
      });

      const globalState         = this.options;
      globalState.classInstance = this;
      globalState.data          = this.data;
      globalState.tasks         = this.tasks;
      this.ctx                  = document.createElement('canvas').getContext('2d');

      this.customComponents = customComponents;
      this.registerComponents();

      this.app = new Vue({
        el : '#' + containerId,
        template : `<div id="${prefix}-elastigantt">
        <${self.prefix}-main></${self.prefix}-main>
      </div>`,
        data : globalState,
        created() {
          let tasks         = this.$root.$data.tasks;
          let firstTaskTime = Number.MAX_SAFE_INTEGER;
          let lastTaskTime  = 0;
          let firstTaskDate, lastTaskDate;
          for (let index = 0, len = this.tasks.length; index < len; index++) {
            let task        = this.tasks[index];
            task.startDate  = new Date(task.start);
            task.startTime  = task.startDate.getTime();
            task.durationMs = task.duration * 1000;
            if (task.startTime < firstTaskTime) {
              firstTaskTime = task.startTime;
              firstTaskDate = task.startDate;
            }
            if (task.startTime + task.durationMs > lastTaskTime) {
              lastTaskTime = task.startTime + task.durationMs;
              lastTaskDate = new Date(task.startTime + task.durationMs);
            }
          }
          this.times.firstTaskTime = firstTaskTime;
          this.times.lastTaskTime  = lastTaskTime;
          this.times.firstTaskDate = firstTaskDate;
          this.times.lastTaskDate  = lastTaskDate;
          this.recalculate();
        },
        methods : {
          calculateCalendarDimensions() {
            this.calendar.height = 0;
            if (this.calendar.hour.display) {
              this.calendar.height += this.calendar.hour.height;
            }
            if (this.calendar.day.display) {
              this.calendar.height += this.calendar.day.height;
            }
            if (this.calendar.month.display) {
              this.calendar.height += this.calendar.month.height;
            }
          },
          calculateTaskListColumnWidths() {
            let final = 0;
            this.taskList.columns.forEach((column) => {
              column.finalWidth = column.width / 100 * this.taskList.percent;
              final += column.finalWidth;
            });
            console.log(final);
            this.taskList.finalWidth = final;
          },
          recalculate() {
            const firstDate      = this.times.firstTaskDate.toISOString().split('T')[0] + 'T00:00:00';
            const lastDate       = this.times.lastTaskDate.toISOString().split('T')[0] + 'T23:59:59.999';
            this.times.firstDate = dayjs(firstDate).locale(this.locale).subtract(this.scope.before, 'days').toDate();
            this.times.lastDate  = dayjs(lastDate).locale(this.locale).add(this.scope.after, 'days').toDate();
            this.times.firstTime = this.times.firstDate.getTime();
            this.times.lastTime  = this.times.lastDate.getTime();
            this.times.totalViewDurationMs = this.times.lastTime - this.times.firstTime;
            this.taskList.width            = this.taskList.columns
                                      .reduce(
                                          (prev, current) => {
                                            return {width : prev.width + current.width};
                                          },
                                          {width : 0})
                                      .width;
            let max                        = this.times.timeScale * 60;
            let min                        = this.times.timeScale;
            let steps                      = max / min;
            let percent                    = this.times.timeZoom / 100;
            this.times.timePerPixel        = this.times.timeScale * steps * percent + Math.pow(2, this.times.timeZoom);
            this.times.totalViewDurationPx = this.times.totalViewDurationMs / this.times.timePerPixel;
            this.times.stepPx              = this.times.stepMs / this.times.timePerPixel;
            this.width                     = this.times.totalViewDurationPx + this.verticalGrid.strokeWidth;
            this.times.steps               = Math.ceil(this.times.totalViewDurationPx / this.times.stepPx);

            this.calculateCalendarDimensions();
            this.calculateTaskListColumnWidths();
            this.height = this.tasks.length * (this.row.height + this.horizontalGrid.gap * 2) + this.horizontalGrid.gap +
                          this.calendar.height + this.$root.$data.calendar.strokeWidth + this.$root.$data.calendar.gap;
            for (let index = 0, len = this.tasks.length; index < len; index++) {
              let task   = this.tasks[index];
              task.width = task.durationMs / this.times.timePerPixel - this.verticalGrid.strokeWidth;
              if (task.width < 0) {
                task.width = 0;
              }
              task.height = this.row.height;
              let x       = task.startTime - this.times.firstTime;
              if (x) {
                x = x / this.times.timePerPixel;
              }
              task.x = x + this.verticalGrid.strokeWidth;
              task.y = ((this.row.height + this.horizontalGrid.gap * 2) * index) + this.horizontalGrid.gap +
                       this.calendar.height + this.$root.$data.calendar.strokeWidth + this.$root.$data.calendar.gap;
            }
          },
          getSVG() {
            return this.svgElement.outerHTML;
          },
          getImage(type = 'image/png') {
            return new Promise((resolve, reject) => {
              const img  = new Image();
              img.onload = () => {
                const canvas  = document.createElement('canvas');
                canvas.width  = this.svgElement.clientWidth;
                canvas.height = this.svgElement.clientHeight;
                canvas.getContext('2d').drawImage(img, 0, 0);
                resolve(canvas.toDataURL(type));
              };
              img.src = "data:image/svg+xml," + encodeURIComponent(this.getSVG());
            });
          }
        }
      });
    }
  }
  window.ElastiganttApp = ElastiganttApp;

  exports.ElastiganttApp = ElastiganttApp;

  return exports;

}({}));
//# sourceMappingURL=elastigantt.js.map