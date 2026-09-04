import { localTrans } from '@capital/common';

export const Translate = {
  punchlist: localTrans({ 'zh-CN': '缺陷清单', 'en-US': 'Punchlist' }),
  timesheets: localTrans({ 'zh-CN': '工时', 'en-US': 'Timesheets' }),
  parts: localTrans({ 'zh-CN': '物料', 'en-US': 'Parts' }),

  add: localTrans({ 'zh-CN': '新增', 'en-US': 'Add' }),
  newItem: localTrans({ 'zh-CN': '新增缺陷', 'en-US': 'New item' }),
  logHours: localTrans({ 'zh-CN': '登记工时', 'en-US': 'Log hours' }),
  addPart: localTrans({ 'zh-CN': '新增物料', 'en-US': 'Add part' }),

  ref: localTrans({ 'zh-CN': '编号', 'en-US': 'Ref' }),
  title: localTrans({ 'zh-CN': '标题', 'en-US': 'Title' }),
  description: localTrans({ 'zh-CN': '描述', 'en-US': 'Description' }),
  status: localTrans({ 'zh-CN': '状态', 'en-US': 'Status' }),
  priority: localTrans({ 'zh-CN': '优先级', 'en-US': 'Priority' }),
  asset: localTrans({ 'zh-CN': '设备', 'en-US': 'Asset' }),
  device: localTrans({ 'zh-CN': '设备名', 'en-US': 'Device' }),
  system: localTrans({ 'zh-CN': '系统', 'en-US': 'System' }),
  assignee: localTrans({ 'zh-CN': '负责人', 'en-US': 'Assignee' }),
  due: localTrans({ 'zh-CN': '截止', 'en-US': 'Due' }),
  actions: localTrans({ 'zh-CN': '操作', 'en-US': 'Actions' }),

  fixVerify: localTrans({ 'zh-CN': '修复 → 验收', 'en-US': 'Fix → verify' }),
  markFixed: localTrans({ 'zh-CN': '标记已修复', 'en-US': 'Mark fixed' }),
  verify: localTrans({ 'zh-CN': '验收', 'en-US': 'Verify' }),
  notFixed: localTrans({ 'zh-CN': '未修复', 'en-US': 'Not fixed' }),
  awaitingVerify: localTrans({
    'zh-CN': '待验收',
    'en-US': 'Awaiting verify',
  }),
  verified: localTrans({ 'zh-CN': '已验收', 'en-US': 'Verified' }),

  date: localTrans({ 'zh-CN': '日期', 'en-US': 'Date' }),
  who: localTrans({ 'zh-CN': '人员', 'en-US': 'Who' }),
  hours: localTrans({ 'zh-CN': '工时', 'en-US': 'Hours' }),
  area: localTrans({ 'zh-CN': '区域', 'en-US': 'Area' }),
  taskType: localTrans({ 'zh-CN': '任务类型', 'en-US': 'Task' }),
  hourType: localTrans({ 'zh-CN': '类别', 'en-US': 'Type' }),
  work: localTrans({ 'zh-CN': '工作内容', 'en-US': 'Work' }),
  submit: localTrans({ 'zh-CN': '提交', 'en-US': 'Submit' }),
  approve: localTrans({ 'zh-CN': '通过', 'en-US': 'Approve' }),
  reject: localTrans({ 'zh-CN': '退回', 'en-US': 'Reject' }),
  reopen: localTrans({ 'zh-CN': '重新打开', 'en-US': 'Reopen' }),
  locked: localTrans({ 'zh-CN': '已锁定', 'en-US': 'Locked' }),
  weekToDate: localTrans({
    'zh-CN': '本周累计',
    'en-US': 'Week to date',
  }),
  weekTotal: localTrans({
    'zh-CN': '本周合计',
    'en-US': 'week to date',
  }),
  showEmptyAreas: localTrans({
    'zh-CN': '显示无工时的区域',
    'en-US': 'Show areas with no hours',
  }),
  whoWorkedHere: localTrans({
    'zh-CN': '展开查看每人工时',
    'en-US': 'Show hours per person',
  }),
  total: localTrans({ 'zh-CN': '合计', 'en-US': 'Total' }),
  noApprovalConfigured: localTrans({
    'zh-CN': '本群未配置审批, 提交即为最终状态',
    'en-US': 'No approval configured — submitting finalises the entry',
  }),

  part: localTrans({ 'zh-CN': '物料', 'en-US': 'Part' }),
  manufacturer: localTrans({ 'zh-CN': '厂商', 'en-US': 'Manufacturer' }),
  partNumber: localTrans({ 'zh-CN': '型号', 'en-US': 'Part number' }),
  quantity: localTrans({ 'zh-CN': '数量', 'en-US': 'Qty' }),
  destination: localTrans({ 'zh-CN': '去向', 'en-US': 'Destination' }),
  poNumber: localTrans({ 'zh-CN': '采购单号', 'en-US': 'PO' }),
  expected: localTrans({ 'zh-CN': '预计到货', 'en-US': 'Expected' }),
  receive: localTrans({ 'zh-CN': '到货', 'en-US': 'Receive' }),
  install: localTrans({ 'zh-CN': '安装', 'en-US': 'Install' }),
  serialNumber: localTrans({ 'zh-CN': '序列号', 'en-US': 'Serial' }),

  saved: localTrans({ 'zh-CN': '已保存', 'en-US': 'Saved' }),
  titleRequired: localTrans({
    'zh-CN': '请填写标题',
    'en-US': 'A title is required',
  }),
  descriptionRequired: localTrans({
    'zh-CN': '请填写描述',
    'en-US': 'A description is required',
  }),
  hoursRequired: localTrans({
    'zh-CN': '请填写工时',
    'en-US': 'Hours are required',
  }),
  hoursInvalid: localTrans({
    'zh-CN': '工时格式为 8.5 或 8:30',
    'en-US': 'Enter hours as 8.5 or 8:30',
  }),
  hoursHint: localTrans({
    'zh-CN': '工时 (8.5 或 8:30)',
    'en-US': 'Hours (8.5 or 8:30)',
  }),
};
