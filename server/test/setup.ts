import dotenv from 'dotenv';
import { TEST_ADMIN_USER_ID } from './constants';

/**
 * 读取.env环境变量配置文件
 */
dotenv.config();

/**
 * Server-administrator ids are read from the environment once, when the SDK's
 * config module loads. setupFiles run before the test module graph, so this is
 * the only place the value can be fixed for the whole suite.
 */
process.env.ADMIN_USER_IDS = TEST_ADMIN_USER_ID;
