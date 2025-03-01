import React from 'react';
import ReactDOM from 'react-dom';
import { merge } from 'lodash';
import { DataCell, CornerCell, measureTextWidth } from '@antv/s2';
import { SheetComponent } from '@antv/s2-react';
import '@antv/s2-react/dist/style.min.css';

// 进度条
const PROGRESS_BAR = {
  width: 80,
  height: 10,
  innerHeight: 6,
};

// 期望线
const EXPECTED_LINE = {
  width: 1,
  height: 12,
  color: '#000',
};

// 当前进度状态颜色
const STATUS_COLOR = {
  healthy: '#30BF78',
  late: '#FAAD14',
  danger: '#F4664A',
};

const DERIVE_COLOR = {
  up: '#F4664A',
  down: '#30BF78',
};

// 间距
const PADDING = 10;

function getStatusColorByProgress(realProgress, expectedProgress) {
  const leftWorker = expectedProgress - realProgress;
  if (leftWorker <= 0.1) {
    return STATUS_COLOR.healthy;
  }
  if (leftWorker > 0.1 && leftWorker <= 0.3) {
    return STATUS_COLOR.late;
  }
  return STATUS_COLOR.danger;
}

const CONTAINER_COLOR = '#E9E9E9';

class KpiStrategyDataCell extends DataCell {
  // 重写数值单元格
  initCell() {
    super.initCell();
    // 在绘制完原本的单元格后, 再绘制进度条和衍生指标
    this.renderProgressBar();
    this.renderDeriveValue();
  }

  // 如果是进度, 格式化为百分比 (只做 demo 示例, 请根据实际情况使用)
  getFormattedFieldValue() {
    const { data } = this.meta;
    if (!data || !data.isProgress) {
      return super.getFormattedFieldValue();
    }
    const formattedValue = `${data.value * 100} %`;
    return { formattedValue, value: data.value };
  }

  // 绘制衍生指标
  renderDeriveValue() {
    // 通过 this.meta 拿到当前单元格的有效信息
    const { x, width, data } = this.meta;
    if (!data || data.isExtra) {
      return;
    }
    const value = data?.compare ?? '';
    const isDown = value.startsWith('-');
    const color = isDown ? DERIVE_COLOR.down : DERIVE_COLOR.up;
    const displayValue = value.replace('-', '');
    const text = isDown ? `↓${displayValue}` : `↑${displayValue}`;
    const textStyle = {
      fill: color,
      fontSize: 12,
    };
    // 获取当前文本坐标
    const { maxY } = this.textShape.getBBox();
    // 获取当前文本宽度
    const textWidth = measureTextWidth(text, textStyle);
    // 衍生指标靠右显示
    const textX = x + width - textWidth - PADDING;
    // 衍生指标和数值对齐显示
    const textY = maxY;

    this.addShape('text', {
      attrs: {
        x: textX,
        y: textY,
        text,
        ...textStyle,
      },
    });
  }

  // 绘制子弹进度条

  renderProgressBar() {
    const { x, y, width, height, data } = this.meta;
    if (!data || !data.isProgress) {
      return;
    }
    const currentProgress = data.value;
    const expectedProgress = data.expectedValue;

    const currentProgressWidth = Math.min(
      PROGRESS_BAR.width * currentProgress,
      PROGRESS_BAR.width,
    );

    // 总进度条
    this.addShape('rect', {
      attrs: {
        x: x + width - PROGRESS_BAR.width - PADDING,
        y: y + (height - PROGRESS_BAR.height) / 2,
        width: PROGRESS_BAR.width,
        height: PROGRESS_BAR.height,
        fill: CONTAINER_COLOR,
      },
    });
    // 当前进度条
    this.addShape('rect', {
      attrs: {
        x: x + width - PROGRESS_BAR.width - PADDING,
        y: y + (height - PROGRESS_BAR.innerHeight) / 2,
        width: currentProgressWidth,
        height: PROGRESS_BAR.innerHeight,
        fill: getStatusColorByProgress(currentProgress, expectedProgress),
      },
    });
    // 期望线
    this.addShape('line', {
      attrs: {
        x1:
          x +
          width -
          PROGRESS_BAR.width +
          PROGRESS_BAR.width * expectedProgress,
        y1: y + (height - EXPECTED_LINE.height) / 2,
        x2:
          x +
          width -
          PROGRESS_BAR.width +
          PROGRESS_BAR.width * expectedProgress,
        y2: y + (height - EXPECTED_LINE.height) / 2 + EXPECTED_LINE.height,
        stroke: EXPECTED_LINE.color,
        lineWidth: EXPECTED_LINE.width,
        opacity: 0.25,
      },
    });
  }
}

fetch('../data/kpi-strategy.json')
  .then((res) => res.json())
  .then(({ data, totalData }) => {
    const s2DataConfig = {
      fields: {
        rows: ['type', 'subType'],
        columns: ['name'],
        values: ['value'],
        valueInCols: true,
      },
      meta: [
        {
          field: 'type',
          name: '指标',
        },
        {
          field: 'name',
          name: '日期',
          formatter: (value) => value ?? '-',
        },
        {
          field: 'subType',
          name: '子类别',
        },
        {
          field: 'value',
        },
      ],
      data,
      totalData,
    };

    const s2Options = {
      width: 600,
      height: 480,
      hierarchyType: 'tree',
      tooltip: {
        operation: {
          trend: true,
          hiddenColumns: true,
        },
      },
      interaction: {
        selectedCellsSpotlight: true,
        hoverHighlight: true,
      },
      // 默认数值挂列头, 会同时显示列头和数值, 隐藏数值列, 使其列头只展示日期, 更美观
      style: {
        colCfg: {
          hideMeasureColumn: true,
        },
        cellCfg: {
          width: 150,
        },
      },
      // 自定义角头文本
      cornerText: '指标',
      // 覆盖默认数值单元格, 额外绘制衍生指标和子弹图
      dataCell: (viewMeta) =>
        new KpiStrategyDataCell(viewMeta, viewMeta.spreadsheet),
    };

    // 覆盖默认主题, 让单元格文字靠左显示
    const theme = {
      dataCell: {
        // 父节点
        bolderText: {
          textAlign: 'left',
        },
        // 子节点
        text: {
          textAlign: 'left',
        },
      },
    };

    ReactDOM.render(
      <SheetComponent
        dataCfg={s2DataConfig}
        options={s2Options}
        sheetType="pivot"
        themeCfg={{
          theme: merge({}, theme),
        }}
      />,
      document.getElementById('container'),
    );
  });
