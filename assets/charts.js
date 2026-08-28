// Guoyue Workstation V3 - Complete Rendering & Chart Library
(function() {
    var D = window.GUOYUE_DATA;
    var C = {}; // chart instances
    var inited = {}; // module chart init state

    // ====== UTILITIES ======
    function fmt(n) { return (n || 0).toLocaleString('zh-CN', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
    function fmtWan(n) { return ((n || 0) / 10000).toFixed(2) + '万'; }
    function fmtInt(n) { return (n || 0).toLocaleString('zh-CN'); }
    function pct(a, b) { return b > 0 ? (a / b * 100).toFixed(1) + '%' : '0.0%'; }
    function esc(s) { return String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function money(n) { return '¥' + fmt(n); }
    function moneyWan(n) { return '¥' + fmtWan(n); }

    var COLORS = {
        accent: '#2563eb', accent2: '#0ea5e9', ink: '#1e293b', muted: '#64748b',
        rule: '#e2e8f0', bg2: '#ffffff', success: '#16a34a', warning: '#f59e0b',
        danger: '#dc2626', purple: '#8b5cf6', pink: '#ec4899'
    };
    var PAL = ['#2563eb', '#0ea5e9', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    var MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

    function echart(id) {
        var el = document.getElementById(id);
        if (!el) return null;
        return echarts.init(el, null, { renderer: 'svg' });
    }

    // ====== MODULE: DASHBOARD ======
    function renderDashboard() {
        var ov = D.overview;
        var html = '';
        html += '<div class="page-header"><div><h2>项目经营驾驶舱</h2><div class="breadcrumb">国樾龙城湾 · 2026年度经营总览</div></div></div>';

        // KPI Cards - all clickable
        html += '<div class="kpi-grid">';
        html += kpiCard('年度总应收', moneyWan(ov.all_income_recv), 'accent', '含存量+增量+物业+能源+转让', 'showIncomeBreakdown()');
        html += kpiCard('年度总实收', moneyWan(ov.all_income_coll), 'success', '回款率 ' + pct(ov.all_income_coll, ov.all_income_recv), 'showCollectionBreakdown()');
        html += kpiCard('回款率', pct(ov.all_income_coll, ov.all_income_recv), ov.all_income_coll / ov.all_income_recv > 0.5 ? 'success' : 'warning', '点击查看计算明细', 'showRateDetail()');
        html += kpiCard('在租商户', ov.total_merchants + '户', '', '退租6户 · 新增' + ov.incr_merchants + '户', 'showAllMerchants()');
        html += kpiCard('增量收入', moneyWan(ov.incr_grand_total), 'accent2', '目标 ' + moneyWan(ov.incr_target) + ' · 完成率 ' + pct(ov.incr_grand_total, ov.incr_target), 'switchModule(\'incremental\',null)');
        html += kpiCard('物业费应收', moneyWan(ov.prop_recv), 'warning', '实收 ' + moneyWan(ov.prop_coll) + ' · 欠费 ' + moneyWan(ov.prop_unpaid), 'switchModule(\'property\',null)');
        html += kpiCard('能源费收入', moneyWan(ov.energy_total), 'success', '1-7月已录入', 'switchModule(\'energy\',null)');
        html += kpiCard('年度总支出', moneyWan(ov.expense_total), 'danger', '净利润 ' + moneyWan(ov.all_income_coll - ov.expense_total), 'switchModule(\'expense\',null)');
        html += '</div>';

        // Charts
        html += '<div class="section-title">月度收支走势</div>';
        html += '<div class="chart-box" id="chart-income-expense" style="height:340px"></div>';

        html += '<div class="chart-grid two-col">';
        html += '<div><div class="section-title">收入分类占比</div><div class="chart-box" id="chart-income-pie" style="height:300px"></div></div>';
        html += '<div><div class="section-title">支出分类占比</div><div class="chart-box" id="chart-expense-pie" style="height:300px"></div></div>';
        html += '</div>';

        html += '<div class="section-title">月度分类支出堆叠</div>';
        html += '<div class="chart-box" id="chart-expense-stack" style="height:340px"></div>';

        // Quick links
        html += '<div class="section-title">快捷入口</div>';
        html += '<div class="kpi-grid">';
        html += linkCard('存量租金台账', 'existing', '54户存量商户租金收缴');
        html += linkCard('增量收入台账', 'incremental', '9户新增商户·租金+装修+物业');
        html += linkCard('物业费台账', 'property', '应收/实收/欠费分类');
        html += linkCard('能源费台账', 'energy', '月度能源费统计');
        html += linkCard('转让费及其他', 'transfer', '转让费+未退定金');
        html += linkCard('支出管理', 'expense', '分类支出明细');
        html += '</div>';

        document.getElementById('module-dashboard').innerHTML = html;
    }

    function initDashboardCharts() {
        // 1. Monthly Income vs Expense
        var c1 = echart('chart-income-expense');
        if (c1) {
            var incData = D.monthly_income.map(function(m) {
                return m['存量租金'] + m['增量租金'] + m['物业费'] + m['能源费'] + m['转让费及其他'];
            });
            var expData = D.monthly_expense.map(function(m) {
                return m['人工成本'] + m['行政办公'] + m['工程维修'] + m['营销宣传'] + m['菜市场'];
            });
            c1.setOption({
                animation: false,
                tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) {
                    var s = p[0].axisValue + '<br/>';
                    p.forEach(function(i) { s += i.marker + i.seriesName + ': ' + moneyWan(i.value) + '<br/>'; });
                    return s;
                }},
                legend: { bottom: 0, textStyle: { color: COLORS.muted, fontSize: 11 } },
                grid: { top: 20, bottom: 40, left: 60, right: 20 },
                xAxis: { type: 'category', data: MONTHS, axisLabel: { color: COLORS.muted }, axisLine: { lineStyle: { color: COLORS.rule } } },
                yAxis: { type: 'value', axisLabel: { color: COLORS.muted, formatter: function(v) { return fmtWan(v); } }, splitLine: { lineStyle: { color: COLORS.rule, type: 'dashed' } } },
                series: [
                    { name: '月度收入', type: 'line', smooth: true, data: incData, itemStyle: { color: COLORS.accent }, areaStyle: { opacity: 0.08 } },
                    { name: '月度支出', type: 'bar', data: expData, itemStyle: { color: COLORS.accent2 }, barWidth: '40%' }
                ]
            });
            C['income-expense'] = c1;
        }

        // 2. Income Pie
        var c2 = echart('chart-income-pie');
        if (c2) {
            c2.setOption({
                animation: false,
                tooltip: { trigger: 'item', formatter: function(p) { return p.name + ': ' + moneyWan(p.value) + ' (' + p.percent.toFixed(1) + '%)'; } },
                legend: { bottom: 0, textStyle: { color: COLORS.muted, fontSize: 10 }, type: 'scroll' },
                series: [{
                    type: 'pie', radius: ['35%', '60%'], center: ['50%', '42%'],
                    label: { formatter: function(p) { return p.name + '\n' + pct(p.value, D.overview.all_income_recv); }, color: COLORS.muted, fontSize: 10 },
                    data: D.income_categories.map(function(c, i) { return { name: c.name, value: c.value, itemStyle: { color: PAL[i] } }; })
                }]
            });
            C['income-pie'] = c2;
            // Click pie segment to jump to module
            c2.on('click', function(params) {
                var modMap = { '存量租金': 'existing', '增量收入': 'incremental', '物业费': 'property', '能源费': 'energy', '转让费及其他': 'transfer' };
                if (modMap[params.name]) switchModule(modMap[params.name], null);
            });
        }

        // 3. Expense Pie
        var c3 = echart('chart-expense-pie');
        if (c3) {
            c3.setOption({
                animation: false,
                tooltip: { trigger: 'item', formatter: function(p) { return p.name + ': ' + moneyWan(p.value) + ' (' + p.percent.toFixed(1) + '%)'; } },
                legend: { bottom: 0, textStyle: { color: COLORS.muted, fontSize: 10 }, type: 'scroll' },
                series: [{
                    type: 'pie', radius: ['35%', '60%'], center: ['50%', '42%'],
                    label: { formatter: function(p) { return p.name + '\n' + pct(p.value, D.expense_total); }, color: COLORS.muted, fontSize: 10 },
                    data: D.expense_categories.map(function(c, i) { return { name: c.name, value: c.value, itemStyle: { color: PAL[i] } }; })
                }]
            });
            C['expense-pie'] = c3;
            // Click pie segment to show expense detail
            c3.on('click', function(params) {
                if (params.name && D.expense_cats[params.name]) {
                    showExpenseModal(params.name);
                }
            });
        }

        // 4. Stacked Monthly Expense
        var c4 = echart('chart-expense-stack');
        if (c4) {
            var expMap = { '人工成本类': '人工成本', '行政办公类': '行政办公', '物业工程维修类': '工程维修', '对外宣传营销类': '营销宣传', '菜市场': '菜市场' };
            var cats = Object.keys(D.expense_cats);
            c4.setOption({
                animation: false,
                tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) {
                    var s = p[0].axisValue + '<br/>';
                    p.forEach(function(i) { if (i.value > 0) s += i.marker + i.seriesName + ': ' + money(i.value) + '<br/>'; });
                    return s;
                }},
                legend: { bottom: 0, textStyle: { color: COLORS.muted, fontSize: 10 }, type: 'scroll' },
                grid: { top: 20, bottom: 40, left: 60, right: 20 },
                xAxis: { type: 'category', data: MONTHS, axisLabel: { color: COLORS.muted }, axisLine: { lineStyle: { color: COLORS.rule } } },
                yAxis: { type: 'value', axisLabel: { color: COLORS.muted, formatter: function(v) { return fmtWan(v); } }, splitLine: { lineStyle: { color: COLORS.rule, type: 'dashed' } } },
                series: cats.map(function(cat, i) {
                    var key = expMap[cat] || cat.replace('类','');
                    return {
                        name: cat, type: 'bar', stack: 'total',
                        data: D.monthly_expense.map(function(m) { return m[key] || 0; }),
                        itemStyle: { color: PAL[i % PAL.length] }
                    };
                })
            });
            C['expense-stack'] = c4;
        }
    }

    // ====== MODULE: EXISTING RENT ======
    function renderExisting() {
        var ov = D.overview;
        var em = D.existing_monthly;
        var cats = D.existing_cats;
        var html = '';
        html += '<div class="page-header"><div><h2>存量租金台账</h2><div class="breadcrumb">去年已租商户 · 2026年度租金收缴</div></div></div>';

        // Count merchants with outstanding rent (excluding 减免类 and 退租)
        var arrearsRentCount = D.existing_merchants.filter(function(m) {
            return m.receivable > 0 && m.collected < m.receivable && m.category !== '减免类' && m.category.indexOf('退租') < 0;
        }).length;

        // Calculate occupancy rate - only exclude 退租, problem merchants still count as in-rent
        var vacatedMerchants = D.existing_merchants.filter(function(m) {
            return m.category.indexOf('退租') >= 0;
        });
        var inRentMerchants = D.existing_merchants.filter(function(m) {
            return m.category.indexOf('退租') < 0;
        });
        var inRentCount = inRentMerchants.length;
        var inRentArea = inRentMerchants.reduce(function(s, m) { return s + (m.area || 0); }, 0);
        var projectTotalArea = ov.project_total_area || 17353.17;
        var vacantArea = projectTotalArea - inRentArea;
        var occupancyRateByArea = (inRentArea / projectTotalArea * 100).toFixed(1) + '%';
        var occupancyRateByCount = (inRentCount / D.existing_merchants.length * 100).toFixed(1) + '%';

        // Summary KPIs
        html += '<div class="kpi-grid">';
        html += kpiCard('应收总额', money(ov.existing_recv), 'accent', '点击查看全部', 'showMerchantModal(\'全部应收\')');
        html += kpiCard('实收总额', money(ov.existing_coll), 'success', '点击查看全部', 'showMerchantModal(\'全部实收\')');
        html += kpiCard('差额', money(ov.existing_recv - ov.existing_coll), 'danger', '点击查看欠款商户', 'showMerchantModal(\'差额\')');
        html += kpiCard('欠租商户', arrearsRentCount + '户', 'danger', '点击查看明细', 'showMerchantModal(\'差额\')');
        html += kpiCard('回款率', pct(ov.existing_coll, ov.existing_recv), ov.existing_coll / ov.existing_recv > 0.5 ? 'success' : 'warning', '点击查看计算明细', 'showRateDetail()');
        html += kpiCard('在租商户', inRentCount + '户', '', '退租' + vacatedMerchants.length + '户·点击查看', 'showInRentMerchants()');
        html += kpiCard('在租面积', fmt(inRentArea) + '㎡', '', '项目总面积' + fmt(projectTotalArea) + '㎡·点击查看', 'showInRentMerchants()');
        html += kpiCard('空置面积', fmt(vacantArea) + '㎡', 'warning', '含退租' + fmt(vacatedMerchants.reduce(function(s,m){return s+(m.area||0)},0)) + '㎡+未租·点击看明细', 'showOccupancyRateDetail()');
        html += kpiCard('在租率', occupancyRateByArea, inRentArea / projectTotalArea > 0.6 ? 'success' : 'warning', '按面积计算·点击看明细', 'showOccupancyRateDetail()');
        html += '</div>';

        // Payment type summary cards
        var ec = D.existing_cats;
        html += '<div class="section-title">收缴类型汇总 <span class="st-hint">点击数字查看商户明细</span></div>';
        html += '<div class="kpi-grid">';
        var ptCats = [
            { name: '按期一次性付清', label: '按期一次性付清' },
            { name: '探收一次性付清', label: '探收一次性付清' },
            { name: '逾期+一次', label: '逾期后一次性付清' },
            { name: '分次付清', label: '分次付清' },
            { name: '逾期+分次', label: '逾期后分次付清' },
            { name: '催缴中', label: '催缴中' },
            { name: '一付两年', label: '一次性付两年' },
            { name: '减免类', label: '减免类(首次)' },
            { name: '提前退租', label: '提前退租' },
            { name: '到期退租', label: '到期退租' },
            { name: '未缴', label: '未缴' }
        ];
        ptCats.forEach(function(pt) {
            if (!ec[pt.name]) return;
            var c = ec[pt.name];
            var color = pt.name === '未缴' ? 'danger' : pt.name === '催缴中' ? 'warning' : pt.name.indexOf('逾期') >= 0 ? 'warning' : pt.name.indexOf('退租') >= 0 ? 'danger' : pt.name === '减免类' ? 'accent2' : 'success';
            var amt;
            if (pt.name.indexOf('退租') >= 0) {
                var refundTotal = (c.merchants || []).reduce(function(s, m) { return s + (m.diff || 0); }, 0);
                amt = '应收 ' + money(c.receivable) + ' / 退还 ' + '<span style="color:' + COLORS.danger + '">' + money(refundTotal) + '</span>';
            } else {
                amt = money(c.receivable);
            }
            html += kpiCard(pt.label, c.count + '户', color, amt, 'showMerchantModal(\'' + pt.name + '\')');
        });
        html += '</div>';

        // Category breakdown
        html += '<div class="section-title">收缴分类明细 <span class="st-hint">点击数字查看商户明细</span></div>';
        html += '<div class="table-wrap"><table><thead><tr><th>缴纳类别</th><th>户数</th><th>应收</th><th>实收</th><th>占比</th></tr></thead><tbody>';
        var catOrder = ['按期一次性付清', '探收一次性付清', '逾期+一次', '分次付清', '逾期+分次', '催缴中', '一付两年', '减免类', '提前退租', '到期退租', '未缴'];
        catOrder.forEach(function(cn) {
            if (!cats[cn]) return;
            var c = cats[cn];
            var recvStr, collStr;
            if (cn.indexOf('退租') >= 0) {
                var refundTotal = (c.merchants || []).reduce(function(s, m) { return s + (m.diff || 0); }, 0);
                recvStr = money(c.receivable);
                collStr = '<span style="color:' + COLORS.danger + '">退还 ' + money(refundTotal) + '</span>';
            } else {
                recvStr = money(c.receivable);
                collStr = money(c.collected);
            }
            html += '<tr><td>' + cn + '</td>' +
                '<td class="clickable-num" onclick="showMerchantModal(\'' + cn + '\')">' + c.count + '户</td>' +
                '<td class="money">' + recvStr + '</td>' +
                '<td class="money">' + collStr + '</td>' +
                '<td>' + pct(c.count, ov.total_merchants) + '</td></tr>';
        });
        html += '</tbody></table></div>';

        // Monthly chart
        html += '<div class="section-title">逐月应收实收走势</div>';
        html += '<div class="chart-box" id="chart-existing-monthly" style="height:300px"></div>';

        // Merchant table
        html += '<div class="section-title">全部商户明细</div>';
        html += '<div class="table-wrap" style="max-height:600px;overflow:auto"><table><thead><tr><th>月份</th><th>序号</th><th>商户名称</th><th>面积/㎡</th><th>应收日期</th><th>应收</th><th>实收</th><th>缴纳情况</th><th>备注</th></tr></thead><tbody>';
        D.existing_merchants.forEach(function(m) {
            html += '<tr>' +
                '<td>' + esc(m.month) + '</td>' +
                '<td>' + esc(m.seq) + '</td>' +
                '<td style="font-weight:500">' + esc(m.name) + '</td>' +
                '<td class="money">' + (m.area ? m.area.toFixed(2) : '—') + '</td>' +
                '<td>' + esc(m.recv_date) + '</td>' +
                '<td class="money">' + (m.receivable ? money(m.receivable) : '<span style="color:' + COLORS.danger + '">退租</span>') + '</td>' +
                '<td class="money">' + (m.collected ? money(m.collected) : '—') + '</td>' +
                '<td>' + esc(m.status) + '</td>' +
                '<td style="font-size:12px;color:' + COLORS.muted + '">' + esc(m.remark) + '</td>' +
                '</tr>';
        });
        html += '</tbody></table></div>';

        document.getElementById('module-existing').innerHTML = html;
    }

    function initExistingChart() {
        var c = echart('chart-existing-monthly');
        if (c) {
            var recvData = MONTHS.map(function(m) { return (D.existing_monthly[m] || {}).receivable || 0; });
            var collData = MONTHS.map(function(m) { return (D.existing_monthly[m] || {}).collected || 0; });
            c.setOption({
                animation: false,
                tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) {
                    var s = p[0].axisValue + '<br/>';
                    p.forEach(function(i) { s += i.marker + i.seriesName + ': ' + money(i.value) + '<br/>'; });
                    return s;
                }},
                legend: { bottom: 0, textStyle: { color: COLORS.muted, fontSize: 11 } },
                grid: { top: 20, bottom: 40, left: 70, right: 20 },
                xAxis: { type: 'category', data: MONTHS, axisLabel: { color: COLORS.muted }, axisLine: { lineStyle: { color: COLORS.rule } } },
                yAxis: { type: 'value', axisLabel: { color: COLORS.muted, formatter: function(v) { return fmtWan(v); } }, splitLine: { lineStyle: { color: COLORS.rule, type: 'dashed' } } },
                series: [
                    { name: '应收', type: 'bar', data: recvData, itemStyle: { color: COLORS.accent }, barWidth: '35%' },
                    { name: '实收', type: 'bar', data: collData, itemStyle: { color: COLORS.success }, barWidth: '35%' }
                ]
            });
            C['existing-monthly'] = c;
        }
    }

    // ====== MODULE: INCREMENTAL INCOME ======
    function renderIncremental() {
        var t = D.incr_totals;
        var im = D.incr_monthly;
        var html = '';
        html += '<div class="page-header"><div><h2>增量收入台账</h2><div class="breadcrumb">2026年新增商户 · 租金+装修服务费+物业费</div></div></div>';

        // Summary KPIs - all clickable
        html += '<div class="kpi-grid">';
        html += kpiCard('年租金总额', money(t.rent), 'accent', '占增量 ' + pct(t.rent, t.grand) + '·点击查看', 'showIncrementalModal(\'租金\')');
        html += kpiCard('装修服务费', money(t.deco), 'accent2', '占增量 ' + pct(t.deco, t.grand) + '·点击查看', 'showIncrementalModal(\'装修\')');
        html += kpiCard('物业费', money(t.prop), 'warning', '占增量 ' + pct(t.prop, t.grand) + '·点击查看', 'showIncrementalModal(\'物业\')');
        html += kpiCard('增量总计', money(t.grand), 'success', '目标 ' + money(t.target) + ' · 完成率 ' + pct(t.grand, t.target), 'showIncrementalModal(\'全部\')');
        html += kpiCard('新增商户', D.incr_merchants.length + '户', '', '总面积 ' + fmt(t.area) + '㎡·点击查看', 'showIncrementalModal(\'商户\')');
        html += '</div>';

        // Sub-module: Monthly breakdown
        html += '<div class="section-title">分模块月度统计 <span class="st-hint">含租金/装修服务费/物业费</span></div>';
        html += '<div class="table-wrap"><table><thead><tr><th>月份</th><th>签约数</th><th>年租金</th><th>装修服务费</th><th>物业费</th><th>合计</th></tr></thead><tbody>';
        MONTHS.forEach(function(m) {
            var d = im[m] || { rent: 0, prop: 0, deco: 0, count: 0 };
            var total = d.rent + d.prop + d.deco;
            if (d.count === 0 && total === 0) return;
            html += '<tr><td>' + m + '</td><td>' + d.count + '户</td>' +
                '<td class="money">' + money(d.rent) + '</td>' +
                '<td class="money">' + money(d.deco) + '</td>' +
                '<td class="money">' + money(d.prop) + '</td>' +
                '<td class="money" style="font-weight:600">' + money(total) + '</td></tr>';
        });
        html += '<tr style="background:#f8fafc;font-weight:700"><td>合计</td><td>' + D.incr_merchants.length + '户</td>' +
            '<td class="money">' + money(t.rent) + '</td>' +
            '<td class="money">' + money(t.deco) + '</td>' +
            '<td class="money">' + money(t.prop) + '</td>' +
            '<td class="money">' + money(t.grand) + '</td></tr>';
        html += '</tbody></table></div>';

        // Chart
        html += '<div class="section-title">增量收入月度走势</div>';
        html += '<div class="chart-box" id="chart-incremental" style="height:320px"></div>';

        // Merchant detail table
        html += '<div class="section-title">新增商户明细 <span class="st-hint">点击商户名查看详情</span></div>';
        html += '<div class="table-wrap"><table><thead><tr><th>签约日期</th><th>商户名称</th><th>铺号</th><th>面积/㎡</th><th>年租金</th><th>物业费</th><th>装修服务费</th><th>租期</th><th>免租期</th></tr></thead><tbody>';
        D.incr_merchants.forEach(function(m) {
            html += '<tr>' +
                '<td>' + esc(m.sign_date) + '</td>' +
                '<td style="font-weight:500">' + esc(m.name) + '</td>' +
                '<td>' + esc(m.shop) + '</td>' +
                '<td class="money">' + fmt(m.area) + '</td>' +
                '<td class="money">' + money(m.annual_rent) + '</td>' +
                '<td class="money">' + money(m.prop_fee) + '</td>' +
                '<td class="money">' + money(m.deco_fee) + '</td>' +
                '<td style="font-size:12px">' + esc(m.rent_start) + ' ~ ' + esc(m.rent_end) + '</td>' +
                '<td>' + esc(m.free_period) + '</td>' +
                '</tr>';
        });
        html += '</tbody></table></div>';

        document.getElementById('module-incremental').innerHTML = html;
    }

    function initIncrementalChart() {
        var c = echart('chart-incremental');
        if (c) {
            var im = D.incr_monthly;
            c.setOption({
                animation: false,
                tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) {
                    var s = p[0].axisValue + '<br/>';
                    p.forEach(function(i) { if (i.value > 0) s += i.marker + i.seriesName + ': ' + money(i.value) + '<br/>'; });
                    return s;
                }},
                legend: { bottom: 0, textStyle: { color: COLORS.muted, fontSize: 11 } },
                grid: { top: 20, bottom: 40, left: 60, right: 20 },
                xAxis: { type: 'category', data: MONTHS, axisLabel: { color: COLORS.muted }, axisLine: { lineStyle: { color: COLORS.rule } } },
                yAxis: { type: 'value', axisLabel: { color: COLORS.muted, formatter: function(v) { return fmtWan(v); } }, splitLine: { lineStyle: { color: COLORS.rule, type: 'dashed' } } },
                series: [
                    { name: '年租金', type: 'bar', stack: 'incr', data: MONTHS.map(function(m) { return (im[m] || {}).rent || 0; }), itemStyle: { color: COLORS.accent } },
                    { name: '装修服务费', type: 'bar', stack: 'incr', data: MONTHS.map(function(m) { return (im[m] || {}).deco || 0; }), itemStyle: { color: COLORS.accent2 } },
                    { name: '物业费', type: 'bar', stack: 'incr', data: MONTHS.map(function(m) { return (im[m] || {}).prop || 0; }), itemStyle: { color: COLORS.warning } }
                ]
            });
            C['incremental'] = c;
        }
    }

    // ====== MODULE: PROPERTY FEES ======
    function renderProperty() {
        var t = D.prop_totals;
        var cats = D.prop_cats;
        var pm = D.prop_monthly;
        var html = '';
        html += '<div class="page-header"><div><h2>物业费台账</h2><div class="breadcrumb">存量商户物业费 · 应收/实收/欠费分类</div></div></div>';

        // Count arrears merchants
        var arrearsMerchants = D.prop_merchants.filter(function(m) { return m.unpaid > 0; });

        // Summary KPIs - all clickable
        html += '<div class="kpi-grid">';
        html += kpiCard('应收总额', money(t.recv), 'accent', '点击查看全部', 'showPropModal(\'全部应收\')');
        html += kpiCard('实收总额', money(t.coll), 'success', '点击查看全部', 'showPropModal(\'全部实收\')');
        html += kpiCard('欠费总额', money(t.unpaid), 'danger', '点击查看欠费商户', 'showPropArrearsModal()');
        html += kpiCard('欠费商户', arrearsMerchants.length + '户', 'danger', '点击查看明细', 'showPropArrearsModal()');
        html += kpiCard('收缴率', pct(t.coll, t.recv), t.coll / t.recv > 0.5 ? 'success' : 'warning', '点击查看计算明细', 'showPropRateDetail()');
        html += kpiCard('物业费记录', D.prop_merchants.length + '户', '', '点击查看全部', 'showPropModal(\'全部记录\')');
        html += '</div>';

        // Category breakdown
        html += '<div class="section-title">物业费分类 <span class="st-hint">点击数字查看商户明细</span></div>';
        html += '<div class="table-wrap"><table><thead><tr><th>分类</th><th>户数</th><th>应收</th><th>实收</th><th>欠费</th></tr></thead><tbody>';
        var catOrder = ['已缴清', '部分缴纳', '催缴中', '未缴', '退租', '不收取'];
        catOrder.forEach(function(cn) {
            if (!cats[cn]) return;
            var c = cats[cn];
            var merchantsJson = JSON.stringify(c.merchants).replace(/'/g, "\\'");
            html += '<tr><td><span class="badge ' + (cn === '已缴清' ? 'badge-success' : cn === '退租' ? 'badge-danger' : cn === '欠费' || cn === '未缴' ? 'badge-danger' : 'badge-warning') + '">' + cn + '</span></td>' +
                '<td class="clickable-num" onclick="showPropModal(\'' + cn + '\')">' + c.count + '户</td>' +
                '<td class="money">' + money(c.receivable) + '</td>' +
                '<td class="money">' + money(c.collected) + '</td>' +
                '<td class="money" style="color:' + COLORS.danger + '">' + money(c.unpaid) + '</td></tr>';
        });
        // Add any categories not in the predefined order
        Object.keys(cats).forEach(function(cn) {
            if (catOrder.indexOf(cn) >= 0) return;
            var c = cats[cn];
            html += '<tr><td>' + cn + '</td>' +
                '<td class="clickable-num" onclick="showPropModal(\'' + cn + '\')">' + c.count + '户</td>' +
                '<td class="money">' + money(c.receivable) + '</td>' +
                '<td class="money">' + money(c.collected) + '</td>' +
                '<td class="money">' + money(c.unpaid) + '</td></tr>';
        });
        html += '</tbody></table></div>';

        // Monthly chart
        html += '<div class="section-title">逐月应收实收走势</div>';
        html += '<div class="chart-box" id="chart-property" style="height:300px"></div>';

        // Merchant table
        html += '<div class="section-title">物业费逐户明细</div>';
        html += '<div class="table-wrap" style="max-height:600px;overflow:auto"><table><thead><tr><th>月份</th><th>商铺名称</th><th>应收时间</th><th>应收</th><th>实收</th><th>欠费</th><th>缴纳情况</th><th>备注</th></tr></thead><tbody>';
        D.prop_merchants.forEach(function(m) {
            html += '<tr>' +
                '<td>' + esc(m.month) + '</td>' +
                '<td style="font-weight:500">' + esc(m.name) + '</td>' +
                '<td>' + esc(m.recv_time) + '</td>' +
                '<td class="money">' + money(m.receivable) + '</td>' +
                '<td class="money">' + (m.collected ? money(m.collected) : '—') + '</td>' +
                '<td class="money" style="color:' + (m.unpaid > 0 ? COLORS.danger : '') + '">' + (m.unpaid > 0 ? money(m.unpaid) : '—') + '</td>' +
                '<td>' + esc(m.status) + '</td>' +
                '<td style="font-size:12px;color:' + COLORS.muted + '">' + esc(m.remark) + '</td>' +
                '</tr>';
        });
        html += '</tbody></table></div>';

        document.getElementById('module-property').innerHTML = html;
    }

    function initPropertyChart() {
        var c = echart('chart-property');
        if (c) {
            var pm = D.prop_monthly;
            c.setOption({
                animation: false,
                tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) {
                    var s = p[0].axisValue + '<br/>';
                    p.forEach(function(i) { s += i.marker + i.seriesName + ': ' + money(i.value) + '<br/>'; });
                    return s;
                }},
                legend: { bottom: 0, textStyle: { color: COLORS.muted, fontSize: 11 } },
                grid: { top: 20, bottom: 40, left: 70, right: 20 },
                xAxis: { type: 'category', data: MONTHS, axisLabel: { color: COLORS.muted }, axisLine: { lineStyle: { color: COLORS.rule } } },
                yAxis: { type: 'value', axisLabel: { color: COLORS.muted, formatter: function(v) { return fmtWan(v); } }, splitLine: { lineStyle: { color: COLORS.rule, type: 'dashed' } } },
                series: [
                    { name: '应收', type: 'line', smooth: true, data: MONTHS.map(function(m) { return (pm[m] || {}).receivable || 0; }), itemStyle: { color: COLORS.accent } },
                    { name: '实收', type: 'bar', data: MONTHS.map(function(m) { return (pm[m] || {}).collected || 0; }), itemStyle: { color: COLORS.success }, barWidth: '35%' },
                    { name: '欠费', type: 'line', smooth: true, data: MONTHS.map(function(m) { return (pm[m] || {}).unpaid || 0; }), itemStyle: { color: COLORS.danger }, areaStyle: { opacity: 0.08 } }
                ]
            });
            C['property'] = c;
        }
    }

    // ====== MODULE: ENERGY FEES ======
    function renderEnergy() {
        var html = '';
        html += '<div class="page-header"><div><h2>能源费台账</h2><div class="breadcrumb">月度能源费统计 · 电费+水费盈余</div></div></div>';

        html += '<div class="kpi-grid">';
        html += kpiCard('能源费总收入', money(D.energy_total), 'success', '点击查看月度明细', 'showEnergyModal()');
        html += kpiCard('月均收入', money(D.energy_total / 7), 'accent', '按7个月平均·点击查看', 'showEnergyModal()');
        html += kpiCard('最高月(7月)', money(50027.56), 'warning', '点击查看7月明细', 'showEnergyMonthModal(\'7月\')');
        html += kpiCard('最低月(2月)', money(23288.53), 'accent2', '点击查看2月明细', 'showEnergyMonthModal(\'2月\')');
        html += '</div>';

        // Monthly table
        html += '<div class="section-title">逐月能源费明细</div>';
        html += '<div class="table-wrap"><table><thead><tr><th>月份</th><th>电费盈余</th><th>水费盈余</th><th>合计</th></tr></thead><tbody>';
        D.energy_monthly.forEach(function(m) {
            html += '<tr>' +
                '<td>' + m.month + '</td>' +
                '<td class="money">' + (m.elec ? money(m.elec) : '—') + '</td>' +
                '<td class="money">' + (m.water ? money(m.water) : '—') + '</td>' +
                '<td class="money" style="font-weight:600">' + (m.total ? money(m.total) : '<span style="color:' + COLORS.muted + '">待录入</span>') + '</td></tr>';
        });
        html += '<tr style="background:#f8fafc;font-weight:700"><td>合计</td><td class="money">' + money(D.energy_monthly.reduce(function(s, m) { return s + m.elec; }, 0)) + '</td>' +
            '<td class="money">' + money(D.energy_monthly.reduce(function(s, m) { return s + m.water; }, 0)) + '</td>' +
            '<td class="money">' + money(D.energy_total) + '</td></tr>';
        html += '</tbody></table></div>';

        // Chart
        html += '<div class="section-title">能源费月度走势</div>';
        html += '<div class="chart-box" id="chart-energy" style="height:300px"></div>';

        document.getElementById('module-energy').innerHTML = html;
    }

    function initEnergyChart() {
        var c = echart('chart-energy');
        if (c) {
            c.setOption({
                animation: false,
                tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) {
                    var s = p[0].axisValue + '<br/>';
                    p.forEach(function(i) { if (i.value > 0) s += i.marker + i.seriesName + ': ' + money(i.value) + '<br/>'; });
                    return s;
                }},
                legend: { bottom: 0, textStyle: { color: COLORS.muted, fontSize: 11 } },
                grid: { top: 20, bottom: 40, left: 60, right: 20 },
                xAxis: { type: 'category', data: D.energy_monthly.map(function(m) { return m.month; }), axisLabel: { color: COLORS.muted }, axisLine: { lineStyle: { color: COLORS.rule } } },
                yAxis: { type: 'value', axisLabel: { color: COLORS.muted, formatter: function(v) { return fmtWan(v); } }, splitLine: { lineStyle: { color: COLORS.rule, type: 'dashed' } } },
                series: [
                    { name: '电费盈余', type: 'bar', stack: 'energy', data: D.energy_monthly.map(function(m) { return m.elec; }), itemStyle: { color: COLORS.accent } },
                    { name: '水费盈余', type: 'bar', stack: 'energy', data: D.energy_monthly.map(function(m) { return m.water; }), itemStyle: { color: COLORS.accent2 } },
                    { name: '合计', type: 'line', smooth: true, data: D.energy_monthly.map(function(m) { return m.total; }), itemStyle: { color: COLORS.success } }
                ]
            });
            C['energy'] = c;
        }
    }

    // ====== MODULE: TRANSFER & OTHER ======
    function renderTransfer() {
        var html = '';
        html += '<div class="page-header"><div><h2>转让费及其他收入</h2><div class="breadcrumb">商户转让费 · 未退定金</div></div></div>';

        html += '<div class="kpi-grid">';
        html += kpiCard('总收入', money(D.transfer_total), 'accent', '点击查看全部', 'showTransferModal(\'全部\')');
        html += kpiCard('转让费', money(3500), 'accent2', '2笔·点击查看', 'showTransferModal(\'转让费\')');
        html += kpiCard('其他收入', money(10000), 'warning', '未退定金1笔·点击查看', 'showTransferModal(\'其他\')');
        html += '</div>';

        html += '<div class="section-title">收入明细</div>';
        html += '<div class="table-wrap"><table><thead><tr><th>月份</th><th>商户名称</th><th>费用类别</th><th>转让性质</th><th>面积/㎡</th><th>应收</th><th>实收</th></tr></thead><tbody>';
        D.transfer_records.forEach(function(r) {
            html += '<tr>' +
                '<td>' + esc(r.month) + '</td>' +
                '<td style="font-weight:500">' + esc(r.name) + '</td>' +
                '<td>' + esc(r.fee_type) + '</td>' +
                '<td>' + esc(r.nature) + '</td>' +
                '<td class="money">' + (r.area ? fmt(r.area) : '—') + '</td>' +
                '<td class="money">' + (r.amount ? money(r.amount) : '—') + '</td>' +
                '<td class="money">' + money(r.collected) + '</td></tr>';
        });
        html += '</tbody></table></div>';

        document.getElementById('module-transfer').innerHTML = html;
    }

    // ====== MODULE: COMPLIANCE (按期履约率统计) - 严格按Excel格式 ======
    function renderOnTimeTable(ot, sectionTitle) {
        var html = '';
        html += '<div class="section-title">' + sectionTitle + '</div>';
        html += '<div class="table-wrap"><table style="font-size:12px;min-width:1600px">';
        html += '<thead><tr>';
        html += '<th rowspan="2" style="min-width:100px">铁三角团队</th>';
        html += '<th rowspan="2" style="min-width:80px">项目名称</th>';
        html += '<th colspan="7" style="text-align:center">户数</th>';
        html += '<th colspan="8" style="text-align:center">金额（元）</th>';
        html += '<th rowspan="2" style="min-width:90px">户数履约率</th>';
        html += '<th rowspan="2" style="min-width:90px">金额履约率</th>';
        html += '</tr><tr>';
        // 户数 sub-headers
        html += '<th style="min-width:70px">合同应收</th>';
        html += '<th style="min-width:70px">合同实收</th>';
        html += '<th style="min-width:80px">未收-无方案</th>';
        html += '<th style="min-width:80px">未收-减免</th>';
        html += '<th style="min-width:80px">未收-延期</th>';
        html += '<th style="min-width:80px">未收-其他</th>';
        html += '<th style="min-width:80px">未收户数小计</th>';
        // 金额 sub-headers
        html += '<th style="min-width:90px">合同应收</th>';
        html += '<th style="min-width:90px">财务实收</th>';
        html += '<th style="min-width:90px">合同实收</th>';
        html += '<th style="min-width:80px">未收-无方案</th>';
        html += '<th style="min-width:80px">未收-减免</th>';
        html += '<th style="min-width:80px">未收-延期</th>';
        html += '<th style="min-width:80px">未收-其他</th>';
        html += '<th style="min-width:90px">未收金额小计</th>';
        html += '</tr></thead><tbody>';
        html += '<tr>';
        html += '<td style="text-align:center;font-weight:500">鎏金铁三角</td>';
        html += '<td style="text-align:center">国樾</td>';
        // 户数 data
        html += '<td class="money">' + ot.due_count + '</td>';
        html += '<td class="money text-success">' + ot.paid_count + '</td>';
        html += '<td class="money text-danger">' + ot.unpaid_no_plan_count + '</td>';
        html += '<td class="money text-accent2">' + ot.unpaid_reduction_count + '</td>';
        html += '<td class="money text-warning">' + ot.unpaid_deferred_count + '</td>';
        html += '<td class="money text-muted">' + ot.unpaid_other_count + '</td>';
        html += '<td class="money" style="font-weight:600">' + ot.unpaid_subtotal_count + '</td>';
        // 金额 data
        html += '<td class="money">' + money(ot.due_amount) + '</td>';
        html += '<td class="money text-success">' + money(ot.finance_paid != null ? ot.finance_paid : ot.paid_amount) + '</td>';
        html += '<td class="money text-success">' + money(ot.contract_paid != null ? ot.contract_paid : ot.paid_amount) + '</td>';
        html += '<td class="money text-danger">' + money(ot.unpaid_no_plan_amount) + '</td>';
        html += '<td class="money text-accent2">' + money(ot.unpaid_reduction_amount) + '</td>';
        html += '<td class="money text-warning">' + money(ot.unpaid_deferred_amount) + '</td>';
        html += '<td class="money text-muted">' + money(ot.unpaid_other_amount) + '</td>';
        html += '<td class="money" style="font-weight:600">' + money(ot.unpaid_subtotal_amount) + '</td>';
        // 履约率
        html += '<td class="money" style="font-weight:600;color:var(--accent)">' + ot.count_compliance_rate.toFixed(1) + '%</td>';
        html += '<td class="money" style="font-weight:600;color:var(--accent)">' + ot.amount_compliance_rate.toFixed(1) + '%</td>';
        html += '</tr></tbody></table></div>';
        return html;
    }

    function renderRenewalTable(rn, sectionTitle, isCumulative) {
        var html = '';
        html += '<div class="section-title">' + sectionTitle + '</div>';
        html += '<div class="table-wrap"><table style="font-size:13px;min-width:700px">';
        html += '<thead><tr>';
        html += '<th style="min-width:100px">铁三角团队</th>';
        html += '<th style="min-width:80px">项目名称</th>';
        if (isCumulative) {
            html += '<th style="min-width:120px">累计合同到期户数</th>';
            html += '<th style="min-width:120px">累计续租户数</th>';
            html += '<th style="min-width:120px">累计退租户数</th>';
            html += '<th style="min-width:100px">累计续租率</th>';
        } else {
            html += '<th style="min-width:120px">本周合同到期户数</th>';
            html += '<th style="min-width:120px">本周续租户数</th>';
            html += '<th style="min-width:120px">本周退租户数</th>';
            html += '<th style="min-width:100px">本周续租率</th>';
        }
        html += '<th style="min-width:150px">备注</th>';
        html += '</tr></thead><tbody>';
        html += '<tr>';
        html += '<td style="text-align:center;font-weight:500">鎏金铁三角</td>';
        html += '<td style="text-align:center">国樾</td>';
        html += '<td class="money">' + (rn.expiring_count || 0) + '</td>';
        html += '<td class="money text-success">' + (rn.renewed_count || 0) + '</td>';
        html += '<td class="money text-danger">' + (rn.vacated_count || 0) + '</td>';
        var rateText;
        if (rn.expiring_count > 0) {
            rateText = rn.renewal_rate.toFixed(1) + '%';
        } else {
            rateText = '—';
        }
        html += '<td class="money" style="font-weight:600;color:var(--accent)">' + rateText + '</td>';
        html += '<td style="font-size:12px;color:var(--muted)">' + esc(rn.remark || '') + '</td>';
        html += '</tr></tbody></table></div>';
        return html;
    }

    function renderCompliance() {
        var c = D.compliance;
        if (!c) return;
        var html = '';
        var timeLabel = c.report_time || '每周五16:00前更新';
        html += '<div class="page-header"><div><h2>按期履约率统计表</h2><div class="breadcrumb">' + timeLabel + ' · 统计周期：' + c.week_label + '</div></div></div>';

        // Tab navigation
        html += '<div class="tab-nav" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--rule)">';
        html += '<div class="tab-item active" onclick="switchComplianceTab(\'onTime\', this)" style="padding:10px 20px;cursor:pointer;border-bottom:3px solid var(--accent);margin-bottom:-2px;font-weight:500;color:var(--accent)">按期履约率</div>';
        html += '<div class="tab-item" onclick="switchComplianceTab(\'renewal\', this)" style="padding:10px 20px;cursor:pointer;color:var(--muted)">到期续租率</div>';
        html += '<div class="tab-item" onclick="switchComplianceTab(\'unpaid\', this)" style="padding:10px 20px;cursor:pointer;color:var(--muted)">未收增减率</div>';
        html += '</div>';

        // === Tab 1: 按期履约率 ===
        var ot = c.on_time;
        html += '<div class="compliance-tab" id="compliance-tab-onTime">';
        html += renderOnTimeTable(ot.week, '本周明细（' + (c.week_start || '8.22') + '-' + (c.week_end || '8.28') + '）');
        if (ot.cumulative) {
            html += '<div style="margin-top:24px;border-top:2px dashed var(--rule);padding-top:16px">';
            html += renderOnTimeTable(ot.cumulative, '累计明细（8.1-8.28）');
            html += '</div>';
        }
        html += '</div>';

        // === Tab 2: 到期续租率 ===
        var rn = c.renewal;
        html += '<div class="compliance-tab" id="compliance-tab-renewal" style="display:none">';
        html += renderRenewalTable(rn.week, '本周明细（8.22-8.28）', false);
        if (rn.cumulative) {
            html += '<div style="margin-top:24px;border-top:2px dashed var(--rule);padding-top:16px">';
            html += renderRenewalTable(rn.cumulative, '累计明细（8.1-8.28）', true);
            html += '</div>';
        }
        html += '</div>';

        // === Tab 3: 未收增减率 ===
        var uc = c.unpaid_change;
        html += '<div class="compliance-tab" id="compliance-tab-unpaid" style="display:none">';
        html += '<div class="section-title">本周明细（8.22-8.28）</div>';
        html += '<div class="table-wrap"><table style="font-size:13px;min-width:800px">';
        html += '<thead><tr>';
        html += '<th style="min-width:100px">铁三角团队</th>';
        html += '<th style="min-width:80px">项目名称</th>';
        html += '<th style="min-width:120px">探收金额（元）</th>';
        html += '<th style="min-width:120px">周初未收（元）</th>';
        html += '<th style="min-width:120px">周末未收（元）</th>';
        html += '<th style="min-width:120px">增减数额（元）</th>';
        html += '<th style="min-width:100px">增减率</th>';
        html += '</tr></thead><tbody>';
        html += '<tr>';
        html += '<td style="text-align:center;font-weight:500">鎏金铁三角</td>';
        html += '<td style="text-align:center">国樾</td>';
        html += '<td class="money">' + money(uc.advance_amount || 0) + '</td>';
        html += '<td class="money" style="font-weight:600">' + money(uc.week_start_unpaid) + '</td>';
        html += '<td class="money" style="font-weight:600">' + money(uc.weekend_unpaid) + '</td>';
        var changeCls = uc.change_amount < 0 ? 'text-success' : 'text-danger';
        html += '<td class="money ' + changeCls + '" style="font-weight:600">' + (uc.change_amount >= 0 ? '+' : '') + money(uc.change_amount) + '</td>';
        var rateDisplay;
        if (uc.change_rate == null || uc.change_rate === undefined) {
            rateDisplay = uc.change_rate_display || '—';
            html += '<td class="money ' + changeCls + '" style="font-weight:600">' + esc(rateDisplay) + '</td>';
        } else {
            rateDisplay = (uc.change_rate >= 0 ? '+' : '') + uc.change_rate.toFixed(1) + '%';
            html += '<td class="money ' + changeCls + '" style="font-weight:600">' + rateDisplay + '</td>';
        }
        html += '</tr></tbody></table></div>';
        html += '</div>';

        document.getElementById('compliance-content').innerHTML = html;
    }

    // Compliance tab switching
    window.switchComplianceTab = function(tabId, el) {
        document.querySelectorAll('.compliance-tab').forEach(function(t) { t.style.display = 'none'; });
        document.querySelectorAll('.tab-item').forEach(function(t) {
            t.style.borderBottom = 'none';
            t.style.color = 'var(--muted)';
            t.style.fontWeight = 'normal';
        });
        var tab = document.getElementById('compliance-tab-' + tabId);
        if (tab) tab.style.display = 'block';
        if (el) {
            el.style.borderBottom = '3px solid var(--accent)';
            el.style.color = 'var(--accent)';
            el.style.fontWeight = '500';
            el.style.marginBottom = '-2px';
        }
    };

    // ====== MODULE: EXPENSE ======
    function renderExpense() {
        var html = '';
        html += '<div class="page-header"><div><h2>支出管理</h2><div class="breadcrumb">2026年度分类支出明细 · 点击金额查看逐条</div></div></div>';

        html += '<div class="kpi-grid">';
        html += kpiCard('总支出', money(D.expense_total), 'danger', '1-8月·点击查看全部', 'showExpenseAllModal()');
        html += kpiCard('月均支出', money(D.expense_total / 8), 'warning', '按8个月平均·点击查看', 'showExpenseAllModal()');
        html += kpiCard('最大支出', money(210947.96), 'danger', '人工成本·点击查看', 'showExpenseModal(\'人工成本类\')');
        html += kpiCard('支出笔数', D.expense_records.length + '笔', '', '点击查看全部记录', 'showExpenseAllModal()');
        html += '</div>';

        // Category cards - clickable
        html += '<div class="section-title">分类支出汇总 <span class="st-hint">点击金额弹出逐条明细</span></div>';
        html += '<div class="expense-cat-grid">';
        var cats = Object.keys(D.expense_cats).sort(function(a, b) { return D.expense_cats[b].total - D.expense_cats[a].total; });
        cats.forEach(function(cat, i) {
            var info = D.expense_cats[cat];
            var itemsJson = JSON.stringify(info.items).replace(/'/g, "\\'");
            html += '<div class="expense-cat-card">' +
                '<div class="ec-label">' + esc(cat) + '</div>' +
                '<div class="ec-value clickable-num" onclick="showExpenseModal(\'' + cat.replace(/'/g, "\\'") + '\')">' + money(info.total) + '</div>' +
                '<div class="ec-sub">' + info.items.length + '笔 · 占比 ' + pct(info.total, D.expense_total) + '</div>' +
                '</div>';
        });
        html += '</div>';

        // Monthly trend
        html += '<div class="section-title">月度支出走势</div>';
        html += '<div class="chart-box" id="chart-expense-trend" style="height:300px"></div>';

        // Category proportion
        html += '<div class="chart-grid two-col">';
        html += '<div><div class="section-title">支出分类占比</div><div class="chart-box" id="chart-expense-cat-pie" style="height:280px"></div></div>';
        html += '<div><div class="section-title">月度分类支出堆叠</div><div class="chart-box" id="chart-expense-stack-bar" style="height:280px"></div></div>';
        html += '</div>';

        // All expense records
        html += '<div class="section-title">全部支出记录</div>';
        html += '<div class="table-wrap" style="max-height:500px;overflow:auto"><table><thead><tr><th>月份</th><th>支出类别</th><th>支出内容</th><th>金额</th></tr></thead><tbody>';
        D.expense_records.forEach(function(r) {
            html += '<tr>' +
                '<td>' + esc(r.month) + '</td>' +
                '<td>' + esc(r.category) + '</td>' +
                '<td>' + esc(r.content) + '</td>' +
                '<td class="money">' + money(r.amount) + '</td></tr>';
        });
        html += '</tbody></table></div>';

        document.getElementById('module-expense').innerHTML = html;
    }

    function initExpenseCharts() {
        // Monthly trend
        var c1 = echart('chart-expense-trend');
        if (c1) {
            var totals = MONTHS.map(function(m) { return (D.expense_monthly_totals[m] || 0); });
            c1.setOption({
                animation: false,
                tooltip: { trigger: 'axis', appendToBody: true, formatter: function(p) {
                    return p[0].axisValue + '<br/>' + p.map(function(i) { return i.marker + i.seriesName + ': ' + money(i.value); }).join('<br/>');
                }},
                grid: { top: 20, bottom: 30, left: 60, right: 20 },
                xAxis: { type: 'category', data: MONTHS, axisLabel: { color: COLORS.muted }, axisLine: { lineStyle: { color: COLORS.rule } } },
                yAxis: { type: 'value', axisLabel: { color: COLORS.muted, formatter: function(v) { return fmtWan(v); } }, splitLine: { lineStyle: { color: COLORS.rule, type: 'dashed' } } },
                series: [{ name: '月度支出', type: 'line', smooth: true, data: totals, itemStyle: { color: COLORS.danger }, areaStyle: { opacity: 0.1, color: COLORS.danger } }]
            });
            C['expense-trend'] = c1;
        }

        // Category pie
        var c2 = echart('chart-expense-cat-pie');
        if (c2) {
            c2.setOption({
                animation: false,
                tooltip: { trigger: 'item', formatter: function(p) { return p.name + ': ' + money(p.value) + ' (' + p.percent.toFixed(1) + '%)'; } },
                legend: { bottom: 0, textStyle: { color: COLORS.muted, fontSize: 10 }, type: 'scroll' },
                series: [{
                    type: 'pie', radius: ['30%', '55%'], center: ['50%', '42%'],
                    label: { fontSize: 10, color: COLORS.muted },
                    data: D.expense_categories.map(function(c, i) { return { name: c.name, value: c.value, itemStyle: { color: PAL[i] } }; })
                }]
            });
            C['expense-cat-pie'] = c2;
        }

        // Stacked bar
        var c3 = echart('chart-expense-stack-bar');
        if (c3) {
            var expMap2 = { '人工成本类': '人工成本', '行政办公类': '行政办公', '物业工程维修类': '工程维修', '对外宣传营销类': '营销宣传', '菜市场': '菜市场' };
            var cats = Object.keys(D.expense_cats);
            c3.setOption({
                animation: false,
                tooltip: { trigger: 'axis', appendToBody: true },
                legend: { bottom: 0, textStyle: { color: COLORS.muted, fontSize: 9 }, type: 'scroll' },
                grid: { top: 15, bottom: 35, left: 50, right: 15 },
                xAxis: { type: 'category', data: MONTHS, axisLabel: { color: COLORS.muted, fontSize: 10 }, axisLine: { lineStyle: { color: COLORS.rule } } },
                yAxis: { type: 'value', axisLabel: { color: COLORS.muted, fontSize: 10, formatter: function(v) { return fmtWan(v); } }, splitLine: { lineStyle: { color: COLORS.rule, type: 'dashed' } } },
                series: cats.map(function(cat, i) {
                    var key = expMap2[cat] || cat.replace('类','');
                    return {
                        name: cat, type: 'bar', stack: 'total',
                        data: D.monthly_expense.map(function(m) { return m[key] || 0; }),
                        itemStyle: { color: PAL[i % PAL.length] }
                    };
                })
            });
            C['expense-stack-bar'] = c3;
        }
    }

    // ====== HELPER: KPI Card ======
    function kpiCard(label, value, colorClass, sub, onclick) {
        var cls = onclick ? ' kpi-card clickable' : 'kpi-card';
        var vcls = onclick ? 'kpi-value ' + (colorClass || '') + ' clickable-num' : 'kpi-value ' + (colorClass || '');
        var oc = onclick ? ' onclick="' + onclick + '"' : '';
        return '<div class="' + cls + '"' + oc + '>' +
            '<div class="kpi-label">' + label + '</div>' +
            '<div class="' + vcls + '">' + value + '</div>' +
            (sub ? '<div class="kpi-sub">' + sub + '</div>' : '') +
            '</div>';
    }

    function linkCard(label, moduleId, desc) {
        return '<div class="kpi-card clickable" onclick="switchModule(\'' + moduleId + '\',null)">' +
            '<div class="kpi-label">' + label + '</div>' +
            '<div class="kpi-sub">' + desc + '</div>' +
            '</div>';
    }

    // ====== MODAL FUNCTIONS ======
    window.showMerchantModal = function(catName) {
        var merchants;
        if (catName === '差额') {
            // Show only merchants with outstanding balance (receivable > 0 and collected < receivable)
            merchants = D.existing_merchants.filter(function(m) {
                return m.receivable > 0 && m.collected < m.receivable;
            });
        } else if (catName === '全部应收' || catName === '全部实收') {
            merchants = D.existing_merchants;
        } else {
            var cat = D.existing_cats[catName];
            if (!cat) { return; }
            merchants = cat.merchants || [];
        }
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = catName + '（' + merchants.length + '户）';
        var body = document.getElementById('modal-body');
        var html = '<div class="table-wrap" style="max-height:none;border:none"><table><thead><tr><th>序号</th><th>商户名称</th><th>面积/㎡</th><th>应收日期</th><th>应收</th><th>实收</th><th>缴纳情况</th><th>差额</th></tr></thead><tbody>';
        var totalArea = 0, totalRecv = 0, totalColl = 0, totalDiff = 0;
        merchants.forEach(function(m) {
            totalArea += m.area || 0;
            totalRecv += m.receivable || 0;
            totalColl += m.collected || 0;
            totalDiff += m.diff || 0;
            var isVacated = m.category && m.category.indexOf('退租') >= 0;
            var recv = m.receivable ? money(m.receivable) : (isVacated ? '<span style="color:' + COLORS.muted + '">—</span>' : '—');
            var coll = m.collected ? money(m.collected) : (isVacated ? '<span style="color:' + COLORS.danger + '">' + money(0) + '</span>' : '—');
            var diff = m.diff ? (m.diff < 0 ? '<span style="color:' + COLORS.danger + '">' + money(m.diff) + '</span>' : '<span style="color:' + COLORS.success + '">+' + money(m.diff) + '</span>') : '—';
            html += '<tr><td style="text-align:center">' + esc(m.seq) + '</td>' +
                '<td style="font-weight:500">' + esc(m.name) + '</td>' +
                '<td class="money">' + (m.area ? m.area.toFixed(2) : '—') + '</td>' +
                '<td>' + esc(m.recv_date) + '</td>' +
                '<td class="money">' + recv + '</td>' +
                '<td class="money">' + coll + '</td>' +
                '<td>' + esc(m.status) + '</td>' +
                '<td class="money">' + diff + '</td></tr>';
        });
        // Add totals row
        var diffStr = totalDiff !== 0 ? (totalDiff < 0 ? '<span style="color:' + COLORS.danger + '">' + money(totalDiff) + '</span>' : '<span style="color:' + COLORS.success + '">+' + money(totalDiff) + '</span>') : '—';
        html += '<tr style="background:#f8fafc;font-weight:700">' +
            '<td></td><td>合计（' + merchants.length + '户）</td>' +
            '<td class="money">' + totalArea.toFixed(2) + '</td>' +
            '<td></td>' +
            '<td class="money">' + (totalRecv > 0 ? money(totalRecv) : '—') + '</td>' +
            '<td class="money">' + (totalColl > 0 ? money(totalColl) : '—') + '</td>' +
            '<td></td>' +
            '<td class="money">' + diffStr + '</td></tr>';
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show in-rent merchants only (excluding vacated only, problem merchants still count)
    window.showInRentMerchants = function() {
        var merchants = D.existing_merchants.filter(function(m) {
            return m.category.indexOf('退租') < 0;
        });
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '在租商户（' + merchants.length + '户）';
        var body = document.getElementById('modal-body');
        var html = '<div class="table-wrap" style="max-height:none;border:none"><table><thead><tr><th>序号</th><th>月份</th><th>商户名称</th><th>面积/㎡</th><th>应收</th><th>实收</th><th>缴纳情况</th></tr></thead><tbody>';
        merchants.forEach(function(m) {
            html += '<tr><td>' + esc(m.seq) + '</td><td>' + esc(m.month) + '</td>' +
                '<td style="font-weight:500">' + esc(m.name) + '</td>' +
                '<td class="money">' + (m.area ? m.area.toFixed(2) : '—') + '</td>' +
                '<td class="money">' + (m.receivable ? money(m.receivable) : '—') + '</td>' +
                '<td class="money">' + (m.collected ? money(m.collected) : '—') + '</td>' +
                '<td>' + esc(m.status) + '</td></tr>';
        });
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show occupancy rate calculation detail
    window.showOccupancyRateDetail = function() {
        var total = D.existing_merchants.length;
        var vacated = D.existing_merchants.filter(function(m) { return m.category.indexOf('退租') >= 0; });
        var inRent = D.existing_merchants.filter(function(m) { return m.category.indexOf('退租') < 0; });
        var projectTotalArea = D.overview.project_total_area || 17353.17;
        var inRentArea = inRent.reduce(function(s, m) { return s + (m.area || 0); }, 0);
        var vacatedArea = vacated.reduce(function(s, m) { return s + (m.area || 0); }, 0);
        var unleasedArea = projectTotalArea - inRentArea - vacatedArea;
        var vacantTotal = projectTotalArea - inRentArea;

        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '在租率计算明细';
        var body = document.getElementById('modal-body');
        var html = '<div class="info-card">' +
            '<h4 style="margin-bottom:8px">按商户数计算</h4>' +
            '<div class="info-row"><span class="info-label">存量商户总数</span><span class="info-value">' + total + '户</span></div>' +
            '<div class="info-row"><span class="info-label">在租商户</span><span class="info-value text-success">' + inRent.length + '户（含问题商户，只要未退租即在租）</span></div>' +
            '<div class="info-row"><span class="info-label">退租商户</span><span class="info-value text-danger">' + vacated.length + '户（提前退租' + D.existing_cats['提前退租'].count + '户 + 到期退租' + D.existing_cats['到期退租'].count + '户）</span></div>' +
            '<div class="info-row" style="border-top:2px solid var(--rule);padding-top:8px;margin-top:8px"><span class="info-label">在租率（按户数）</span><span class="info-value text-success" style="font-size:18px">' + (inRent.length / total * 100).toFixed(1) + '%</span></div>' +
            '<hr style="margin:12px 0;border:none;border-top:1px solid var(--rule)">' +
            '<h4 style="margin-bottom:8px">按面积计算（基于项目总面积）</h4>' +
            '<div class="info-row"><span class="info-label">项目总面积</span><span class="info-value">' + fmt(projectTotalArea) + '㎡</span></div>' +
            '<div class="info-row"><span class="info-label">在租面积</span><span class="info-value text-success">' + fmt(inRentArea) + '㎡（含问题商户面积）</span></div>' +
            '<div class="info-row"><span class="info-label">空置面积合计</span><span class="info-value text-danger">' + fmt(vacantTotal) + '㎡</span></div>' +
            '<div class="info-row" style="padding-left:16px"><span class="info-label">其中：退租空置</span><span class="info-value text-warning">' + fmt(vacatedArea) + '㎡</span></div>' +
            '<div class="info-row" style="padding-left:16px"><span class="info-label">其中：未出租</span><span class="info-value text-muted">' + fmt(unleasedArea) + '㎡</span></div>' +
            '<div class="info-row" style="border-top:2px solid var(--rule);padding-top:8px;margin-top:8px"><span class="info-label">在租率（按面积）</span><span class="info-value text-success" style="font-size:18px">' + (inRentArea / projectTotalArea * 100).toFixed(1) + '%</span></div>' +
            '</div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show all merchants (for dashboard "在租商户" card)
    window.showAllMerchants = function() {
        var merchants = D.existing_merchants;
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '全部在租商户（' + merchants.length + '户）';
        var body = document.getElementById('modal-body');
        var html = '<div class="table-wrap" style="max-height:none;border:none"><table><thead><tr><th>序号</th><th>月份</th><th>商户名称</th><th>面积/㎡</th><th>应收</th><th>实收</th><th>缴纳情况</th></tr></thead><tbody>';
        merchants.forEach(function(m) {
            html += '<tr><td>' + esc(m.seq) + '</td><td>' + esc(m.month) + '</td>' +
                '<td style="font-weight:500">' + esc(m.name) + '</td>' +
                '<td class="money">' + (m.area ? m.area.toFixed(2) : '—') + '</td>' +
                '<td class="money">' + (m.receivable ? money(m.receivable) : '<span style="color:' + COLORS.danger + '">退租</span>') + '</td>' +
                '<td class="money">' + (m.collected ? money(m.collected) : '—') + '</td>' +
                '<td>' + esc(m.status) + '</td></tr>';
        });
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show income breakdown (for dashboard "年度总应收" card)
    window.showIncomeBreakdown = function() {
        var ov = D.overview;
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '年度总应收明细拆解';
        var body = document.getElementById('modal-body');
        var rows = [
            { name: '存量租金', value: ov.existing_recv, action: 'switchModule(\'existing\',null)' },
            { name: '增量收入(租金+装修+物业)', value: ov.incr_grand_total, action: 'switchModule(\'incremental\',null)' },
            { name: '物业费', value: ov.prop_recv, action: 'switchModule(\'property\',null)' },
            { name: '能源费', value: ov.energy_total, action: 'switchModule(\'energy\',null)' },
            { name: '转让费及其他', value: ov.transfer_total, action: 'switchModule(\'transfer\',null)' }
        ];
        var html = '<div class="info-card"><table><thead><tr><th>收入类型</th><th>金额</th><th>占比</th><th>操作</th></tr></thead><tbody>';
        rows.forEach(function(r) {
            html += '<tr><td style="font-weight:600">' + r.name + '</td>' +
                '<td class="money">' + money(r.value) + '</td>' +
                '<td>' + pct(r.value, ov.all_income_recv) + '</td>' +
                '<td><span class="clickable-num" onclick="' + r.action + '">查看台账 →</span></td></tr>';
        });
        html += '<tr style="background:#f8fafc;font-weight:700"><td>合计</td><td class="money">' + money(ov.all_income_recv) + '</td><td>100%</td><td></td></tr>';
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show collection breakdown (for dashboard "年度总实收" card)
    window.showCollectionBreakdown = function() {
        var ov = D.overview;
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '年度总实收明细拆解';
        var body = document.getElementById('modal-body');
        var rows = [
            { name: '存量租金实收', value: ov.existing_coll },
            { name: '增量收入(年租金)', value: ov.incr_total_rent },
            { name: '物业费实收', value: ov.prop_coll },
            { name: '能源费收入', value: ov.energy_total },
            { name: '转让费及其他', value: ov.transfer_total }
        ];
        var html = '<div class="info-card"><table><thead><tr><th>收入类型</th><th>已收金额</th><th>占比</th></tr></thead><tbody>';
        rows.forEach(function(r) {
            html += '<tr><td style="font-weight:600">' + r.name + '</td>' +
                '<td class="money">' + money(r.value) + '</td>' +
                '<td>' + pct(r.value, ov.all_income_coll) + '</td></tr>';
        });
        html += '<tr style="background:#f8fafc;font-weight:700"><td>合计</td><td class="money">' + money(ov.all_income_coll) + '</td><td>100%</td></tr>';
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show rate calculation detail (for "回款率" card)
    window.showRateDetail = function() {
        var ov = D.overview;
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '回款率计算明细';
        var body = document.getElementById('modal-body');
        var html = '<div class="info-card">' +
            '<div class="info-row"><span class="info-label">年度总应收</span><span class="info-value">' + money(ov.all_income_recv) + '</span></div>' +
            '<div class="info-row"><span class="info-label">年度总实收</span><span class="info-value">' + money(ov.all_income_coll) + '</span></div>' +
            '<div class="info-row"><span class="info-label">差额（未收）</span><span class="info-value text-danger">' + money(ov.all_income_recv - ov.all_income_coll) + '</span></div>' +
            '<div class="info-row" style="border-top:2px solid var(--rule);padding-top:8px;margin-top:8px"><span class="info-label">回款率</span><span class="info-value text-success" style="font-size:18px">' + pct(ov.all_income_coll, ov.all_income_recv) + '</span></div>' +
            '<hr style="margin:12px 0;border:none;border-top:1px solid var(--rule)">' +
            '<h4 style="margin-bottom:8px">分项回款率</h4>' +
            '<div class="info-row"><span class="info-label">存量租金</span><span class="info-value">' + pct(ov.existing_coll, ov.existing_recv) + '</span></div>' +
            '<div class="info-row"><span class="info-label">物业费</span><span class="info-value">' + pct(ov.prop_coll, ov.prop_recv) + '</span></div>' +
            '</div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    window.showPropModal = function(catName) {
        var merchants;
        var title;
        if (catName === '全部应收' || catName === '全部实收' || catName === '全部记录') {
            merchants = D.prop_merchants;
            title = '物业费 · ' + catName + '（' + merchants.length + '户）';
        } else {
            var cat = D.prop_cats[catName];
            if (!cat) return;
            merchants = cat.merchants || [];
            title = '物业费 · ' + catName + '（' + cat.count + '户）';
        }
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = title;
        var body = document.getElementById('modal-body');
        var html = '<div class="table-wrap" style="max-height:none;border:none"><table><thead><tr><th>月份</th><th>商铺名称</th><th>应收时间</th><th>应收</th><th>实收</th><th>欠费</th><th>缴纳情况</th><th>备注</th></tr></thead><tbody>';
        merchants.forEach(function(m) {
            html += '<tr><td>' + esc(m.month) + '</td>' +
                '<td style="font-weight:500">' + esc(m.name) + '</td>' +
                '<td>' + esc(m.recv_time) + '</td>' +
                '<td class="money">' + money(m.receivable) + '</td>' +
                '<td class="money">' + (m.collected ? money(m.collected) : '—') + '</td>' +
                '<td class="money" style="color:' + (m.unpaid > 0 ? COLORS.danger : '') + '">' + (m.unpaid > 0 ? money(m.unpaid) : '—') + '</td>' +
                '<td>' + esc(m.status) + '</td>' +
                '<td style="font-size:12px">' + esc(m.remark) + '</td></tr>';
        });
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show property fee arrears merchants (欠费商户)
    window.showPropArrearsModal = function() {
        var merchants = D.prop_merchants.filter(function(m) { return m.unpaid > 0; });
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '物业费欠费商户（' + merchants.length + '户 · 欠费合计 ' + money(D.prop_totals.unpaid) + '）';
        var body = document.getElementById('modal-body');
        var html = '<div class="table-wrap" style="max-height:none;border:none"><table><thead><tr><th>月份</th><th>商铺名称</th><th>应收时间</th><th>应收</th><th>实收</th><th>欠费</th><th>缴纳情况</th><th>备注</th></tr></thead><tbody>';
        merchants.forEach(function(m) {
            html += '<tr><td>' + esc(m.month) + '</td>' +
                '<td style="font-weight:500">' + esc(m.name) + '</td>' +
                '<td>' + esc(m.recv_time) + '</td>' +
                '<td class="money">' + money(m.receivable) + '</td>' +
                '<td class="money">' + (m.collected ? money(m.collected) : '—') + '</td>' +
                '<td class="money" style="color:' + COLORS.danger + ';font-weight:600">' + money(m.unpaid) + '</td>' +
                '<td>' + esc(m.status) + '</td>' +
                '<td style="font-size:12px">' + esc(m.remark) + '</td></tr>';
        });
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show property fee rate calculation detail
    window.showPropRateDetail = function() {
        var t = D.prop_totals;
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '物业费收缴率计算明细';
        var body = document.getElementById('modal-body');
        var html = '<div class="info-card">' +
            '<div class="info-row"><span class="info-label">应收总额</span><span class="info-value">' + money(t.recv) + '</span></div>' +
            '<div class="info-row"><span class="info-label">实收总额</span><span class="info-value">' + money(t.coll) + '</span></div>' +
            '<div class="info-row"><span class="info-label">欠费总额</span><span class="info-value text-danger">' + money(t.unpaid) + '</span></div>' +
            '<div class="info-row" style="border-top:2px solid var(--rule);padding-top:8px;margin-top:8px"><span class="info-label">收缴率</span><span class="info-value text-success" style="font-size:18px">' + pct(t.coll, t.recv) + '</span></div>' +
            '<hr style="margin:12px 0;border:none;border-top:1px solid var(--rule)">' +
            '<h4 style="margin-bottom:8px">分类收缴率</h4>';
        var catOrder = ['已缴清', '部分缴纳', '催缴中', '未缴', '退租', '不收取'];
        catOrder.forEach(function(cn) {
            var c = D.prop_cats[cn];
            if (!c) return;
            html += '<div class="info-row"><span class="info-label">' + cn + '（' + c.count + '户）</span><span class="info-value">' + money(c.collected) + ' / ' + money(c.receivable) + '</span></div>';
        });
        html += '</div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show energy fee modal (all months)
    window.showEnergyModal = function() {
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '能源费月度明细（合计 ' + money(D.energy_total) + '）';
        var body = document.getElementById('modal-body');
        var html = '<div class="table-wrap" style="max-height:none;border:none"><table><thead><tr><th>月份</th><th>电费盈余</th><th>水费盈余</th><th>合计</th><th>占比</th></tr></thead><tbody>';
        D.energy_monthly.forEach(function(m) {
            html += '<tr><td>' + esc(m.month) + '</td>' +
                '<td class="money">' + (m.elec ? money(m.elec) : '<span style="color:' + COLORS.muted + '">待录入</span>') + '</td>' +
                '<td class="money">' + (m.water ? money(m.water) : '<span style="color:' + COLORS.muted + '">待录入</span>') + '</td>' +
                '<td class="money" style="font-weight:600">' + (m.total ? money(m.total) : '<span style="color:' + COLORS.muted + '">待录入</span>') + '</td>' +
                '<td>' + (m.total ? pct(m.total, D.energy_total) : '—') + '</td></tr>';
        });
        html += '<tr style="background:#f8fafc;font-weight:700"><td>合计</td><td class="money">' + money(D.energy_monthly.reduce(function(s, m) { return s + m.elec; }, 0)) + '</td>' +
            '<td class="money">' + money(D.energy_monthly.reduce(function(s, m) { return s + m.water; }, 0)) + '</td>' +
            '<td class="money">' + money(D.energy_total) + '</td><td>100%</td></tr>';
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show energy fee for a specific month
    window.showEnergyMonthModal = function(month) {
        var m = D.energy_monthly.find(function(e) { return e.month === month; });
        if (!m) return;
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '能源费 · ' + month + '明细';
        var body = document.getElementById('modal-body');
        var html = '<div class="info-card">' +
            '<div class="info-row"><span class="info-label">月份</span><span class="info-value">' + esc(m.month) + '</span></div>' +
            '<div class="info-row"><span class="info-label">电费盈余</span><span class="info-value">' + money(m.elec) + '</span></div>' +
            '<div class="info-row"><span class="info-label">水费盈余</span><span class="info-value">' + money(m.water) + '</span></div>' +
            '<div class="info-row" style="border-top:2px solid var(--rule);padding-top:8px;margin-top:8px"><span class="info-label">合计</span><span class="info-value text-success" style="font-size:18px">' + money(m.total) + '</span></div>' +
            '<div class="info-row"><span class="info-label">占全年比</span><span class="info-value">' + pct(m.total, D.energy_total) + '</span></div>' +
            '</div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show transfer/other income modal
    window.showTransferModal = function(type) {
        var records;
        if (type === '全部') {
            records = D.transfer_records;
        } else if (type === '转让费') {
            records = D.transfer_records.filter(function(r) { return r.fee_type && r.fee_type.indexOf('转让') >= 0; });
        } else {
            records = D.transfer_records.filter(function(r) { return !r.fee_type || r.fee_type.indexOf('转让') < 0; });
        }
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = type + '明细（' + records.length + '笔）';
        var body = document.getElementById('modal-body');
        var html = '<div class="table-wrap" style="max-height:none;border:none"><table><thead><tr><th>月份</th><th>商户名称</th><th>费用类别</th><th>转让性质</th><th>面积/㎡</th><th>应收</th><th>实收</th></tr></thead><tbody>';
        var totalColl = 0;
        records.forEach(function(r) {
            totalColl += r.collected;
            html += '<tr><td>' + esc(r.month) + '</td>' +
                '<td style="font-weight:500">' + esc(r.name) + '</td>' +
                '<td>' + esc(r.fee_type) + '</td>' +
                '<td>' + esc(r.nature) + '</td>' +
                '<td class="money">' + (r.area ? fmt(r.area) : '—') + '</td>' +
                '<td class="money">' + (r.amount ? money(r.amount) : '—') + '</td>' +
                '<td class="money">' + money(r.collected) + '</td></tr>';
        });
        html += '<tr style="background:#f8fafc;font-weight:700"><td>合计</td><td>' + records.length + '笔</td><td></td><td></td><td></td><td></td><td class="money">' + money(totalColl) + '</td></tr>';
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show incremental income modal
    window.showIncrementalModal = function(type) {
        var merchants = D.incr_merchants;
        var title, highlightField;
        if (type === '租金') { title = '增量年租金明细'; highlightField = 'annual_rent'; }
        else if (type === '装修') { title = '增量装修服务费明细'; highlightField = 'deco_fee'; }
        else if (type === '物业') { title = '增量物业费明细'; highlightField = 'prop_fee'; }
        else if (type === '商户') { title = '新增商户明细'; highlightField = null; }
        else { title = '增量收入全部明细'; highlightField = null; }

        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = title + '（' + merchants.length + '户）';
        var body = document.getElementById('modal-body');
        var html = '<div class="table-wrap" style="max-height:none;border:none"><table><thead><tr><th>签约日期</th><th>商户名称</th><th>铺号</th><th>面积/㎡</th><th>年租金</th><th>物业费</th><th>装修服务费</th><th>合计</th><th>租期</th></tr></thead><tbody>';
        merchants.forEach(function(m) {
            var total = m.annual_rent + m.prop_fee + m.deco_fee;
            var highlightStyle = 'font-weight:600;color:' + COLORS.accent;
            html += '<tr>' +
                '<td>' + esc(m.sign_date) + '</td>' +
                '<td style="font-weight:500">' + esc(m.name) + '</td>' +
                '<td>' + esc(m.shop) + '</td>' +
                '<td class="money">' + fmt(m.area) + '</td>' +
                '<td class="money" style="' + (highlightField === 'annual_rent' ? highlightStyle : '') + '">' + money(m.annual_rent) + '</td>' +
                '<td class="money" style="' + (highlightField === 'prop_fee' ? highlightStyle : '') + '">' + money(m.prop_fee) + '</td>' +
                '<td class="money" style="' + (highlightField === 'deco_fee' ? highlightStyle : '') + '">' + money(m.deco_fee) + '</td>' +
                '<td class="money" style="font-weight:600">' + money(total) + '</td>' +
                '<td style="font-size:12px">' + esc(m.rent_start) + ' ~ ' + esc(m.rent_end) + '</td>' +
                '</tr>';
        });
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    // Show all expense records modal
    window.showExpenseAllModal = function() {
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = '全部支出记录（' + D.expense_records.length + '笔 · 合计 ' + money(D.expense_total) + '）';
        var body = document.getElementById('modal-body');
        var html = '<div class="table-wrap" style="max-height:none;border:none"><table><thead><tr><th>月份</th><th>支出类别</th><th>支出内容</th><th>金额</th></tr></thead><tbody>';
        D.expense_records.forEach(function(r) {
            html += '<tr><td>' + esc(r.month) + '</td>' +
                '<td><span class="badge badge-default">' + esc(r.category) + '</span></td>' +
                '<td style="font-weight:500">' + esc(r.content) + '</td>' +
                '<td class="money">' + money(r.amount) + '</td></tr>';
        });
        html += '<tr style="background:#f8fafc;font-weight:700"><td>合计</td><td></td><td>' + D.expense_records.length + '笔</td><td class="money">' + money(D.expense_total) + '</td></tr>';
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    window.showExpenseModal = function(catName) {
        var cat = D.expense_cats[catName];
        if (!cat) return;
        var modal = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = catName + ' · 逐条明细（' + cat.items.length + '笔 · 合计 ' + money(cat.total) + '）';
        var body = document.getElementById('modal-body');
        var html = '<div class="table-wrap" style="max-height:none;border:none"><table><thead><tr><th>月份</th><th>支出内容</th><th>金额</th></tr></thead><tbody>';
        cat.items.forEach(function(item) {
            html += '<tr><td>' + esc(item.month) + '</td>' +
                '<td style="font-weight:500">' + esc(item.content) + '</td>' +
                '<td class="money">' + money(item.amount) + '</td></tr>';
        });
        html += '<tr style="background:#f8fafc;font-weight:700"><td>合计</td><td>' + cat.items.length + '笔</td><td class="money">' + money(cat.total) + '</td></tr>';
        html += '</tbody></table></div>';
        body.innerHTML = html;
        modal.classList.add('show');
    };

    window.closeModal = function(e) {
        if (e && e.target && e.target.id !== 'modal-overlay') return;
        document.getElementById('modal-overlay').classList.remove('show');
    };

    // ====== MODULE SWITCHING WITH LAZY INIT ======
    window.switchModule = function(id, navEl) {
        document.querySelectorAll('.module-section').forEach(function(s) { s.classList.remove('active'); });
        document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
        var sec = document.getElementById('module-' + id);
        if (sec) sec.classList.add('active');
        if (navEl) navEl.classList.add('active');
        else {
            // Auto-select matching nav item
            var navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(function(n) {
                if (n.getAttribute('onclick') && n.getAttribute('onclick').indexOf("'" + id + "'") >= 0) {
                    n.classList.add('active');
                }
            });
        }
        window.scrollTo(0, 0);

        // Lazy init charts
        setTimeout(function() {
            if (!inited[id]) {
                var initFn = {
                    'dashboard': initDashboardCharts,
                    'existing': initExistingChart,
                    'incremental': initIncrementalChart,
                    'property': initPropertyChart,
                    'energy': initEnergyChart,
                    'expense': initExpenseCharts
                };
                if (initFn[id]) initFn[id]();
                inited[id] = true;
            } else {
                // Resize existing charts
                Object.keys(C).forEach(function(k) { if (C[k]) C[k].resize(); });
            }
        }, 150);
    };

    // ====== INITIALIZATION ======
    document.addEventListener('DOMContentLoaded', function() {
        renderDashboard();
        renderExisting();
        renderIncremental();
        renderProperty();
        renderEnergy();
        renderTransfer();
        renderCompliance();
        renderExpense();
        // Switch to dashboard and init charts
        window.switchModule('dashboard', null);
    });

    // Resize handler
    window.addEventListener('resize', function() {
        Object.keys(C).forEach(function(k) { if (C[k]) C[k].resize(); });
    });
})();
