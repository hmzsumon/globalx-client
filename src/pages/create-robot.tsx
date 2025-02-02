import Layout from '@/Layout';
import { toast } from 'react-toastify';
import { fetchBaseQueryError } from '@/services/helpers';
import RobotHeader from '@/components/AiRobot/RobotHeader';
import Market from '@/components/Trade/Market';
import ProtectedRoute from '@/global/ProtectedRoute';
import { HistoryIcon } from '@/global/icons/CommonIcons';
import { AiFillPlusCircle } from 'react-icons/ai';
import { ImDownload3 } from 'react-icons/im';
import { useRouter } from 'next/router';
import React, { use, useEffect, useState } from 'react';
import { BiTransferAlt } from 'react-icons/bi';
import { HiArrowSmLeft } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import { BeatLoader, ScaleLoader } from 'react-spinners';
import socketIOClient from 'socket.io-client';
import {
	Dialog,
	DialogBody,
	Checkbox,
	Typography,
} from '@material-tailwind/react';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { useTickerContext } from '@/TickerContext';
import Link from 'next/link';
import {
	useCreateAiRobotMutation,
	useEditAiRobotMutation,
	useGetIsAiRobotOnOrOffQuery,
	useMyAiRobotQuery,
} from '@/features/aiRobot/aiRobotApi';
import { useLoadUserQuery } from '@/features/auth/authApi';

const CreateRobot = () => {
	const { refetch } = useLoadUserQuery();
	const router = useRouter();
	const mode = router.query.mode as string;

	const {
		data,
		isLoading: r_isLoading,
		isError: r_isError,
		isSuccess: r_isSuccess,
		error: r_error,
	} = useMyAiRobotQuery(undefined, {
		skip: mode !== 'edit',
	});
	// console.log(data);
	const { aiRobot } = data || {};

	const { data: isAiRobot } = useGetIsAiRobotOnOrOffQuery(undefined);
	const { is_ai_robot } = isAiRobot || {};
	console.log(is_ai_robot);

	const { ticker: ticker2 } = useTickerContext();
	const { user } = useSelector((state: any) => state.auth);
	const [createAiRobot, { isLoading, isError, isSuccess, error }] =
		useCreateAiRobotMutation();

	const [
		editAiRobot,
		{
			isLoading: e_isLoading,
			isError: e_isError,
			isSuccess: e_isSuccess,
			error: e_error,
		},
	] = useEditAiRobotMutation();
	const { symbol } = useSelector((state: any) => state.trade);
	const l_symbol = symbol.toLowerCase();
	const [grid, setGrid] = useState<number>(1);
	const [amount, setAmount] = useState<number>(30);
	const [stateError, setStateError] = useState<boolean>(false);
	const [errorText, setErrorText] = useState<string>('');
	const [minAmount, setMinAmount] = useState<number>(30);
	const [tickers, setTickers] = useState<any[]>([]);
	const [ticker, setTicker] = useState<any>(null);
	const [open, setOpen] = useState<boolean>(false);
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [autoCreate, setAutoCreate] = useState<boolean>(false);
	const handleOpen = () => setOpenModal(!openModal);
	// console.log('Ticker', ticker);
	useEffect(() => {
		if (mode === 'edit' && aiRobot) {
			setGrid(aiRobot?.grid_no);
			setAmount(aiRobot?.current_investment);
			setAutoCreate(aiRobot?.auto_create);

			if (aiRobot?.grid_no == 1) {
				setMinAmount(30);
			} else if (aiRobot?.grid_no == 2) {
				setMinAmount(90);
			} else if (aiRobot?.grid_no == 3) {
				setMinAmount(200);
			} else if (aiRobot?.grid_no == 4) {
				setMinAmount(500);
			} else if (aiRobot?.grid_no == 5) {
				setMinAmount(1000);
			} else if (aiRobot?.grid_no == 6) {
				setMinAmount(2500);
			}
		}
	}, [aiRobot, mode]);

	useEffect(() => {
		const socket = socketIOClient(
			'https://trade-api-85a8c3cba647.herokuapp.com'
		);
		socket.on('tickers', (data: any[]) => {
			setTickers(data);
		});

		return () => {
			socket.disconnect();
		};
	}, [symbol]);

	// set ticker
	useEffect(() => {
		const ticker = tickers.find((t) => t.symbol === symbol);
		setTicker(ticker);
	}, [tickers, symbol]);

	// handle set grid
	const handleSetGrid = (a: any) => {
		if (a >= 30 && a <= 99) {
			setGrid(1);
		} else if (a >= 100 && a <= 299) {
			setGrid(2);
		} else if (a >= 300 && a <= 499) {
			setGrid(3);
		} else if (a >= 500 && a <= 1499) {
			setGrid(4);
		} else if (a >= 1500 && a <= 2999) {
			setGrid(5);
		} else if (a >= 3000) {
			setGrid(6);
		}
	};

	// handle set amount
	const handleSetAmount = (e: any) => {
		const newAmount = e.target.value;

		setAmount(newAmount);

		if (newAmount >= minAmount) {
			setAmount(newAmount);
			setStateError(false);
			setErrorText('');
			if (newAmount > user?.ai_balance) {
				setStateError(true);
				setErrorText('Insufficient balance');
			}
		} else {
			setStateError(true);
			setErrorText(`Amount must be equal or greater than ${minAmount} USDT`);
		}

		// check grid
		handleSetGrid(newAmount);
	};

	// handle create robot
	const handleCreateRobot = () => {
		// check grid no 6
		if (grid > 6) {
			toast.error('Grid no must be less than or equal to 6');
			return;
		}

		if (amount < minAmount) {
			toast.error(
				`If Grid ${grid} Amount must be equal or greater than ${minAmount} USDT`
			);
			return;
		}

		const data = {
			investment: amount,
			pair: l_symbol,
			grid_no: grid,
			price_range:
				Number(ticker?.lowPrice).toFixed(2) +
				' - ' +
				Number(ticker?.highPrice).toFixed(2),
			last_price: ticker?.lastPrice,
			auto_create: autoCreate,
		};
		// console.log(data);
		createAiRobot(data);
	};

	// handle edit robot
	const handleEditRobot = () => {
		const data = {
			investment: amount,
			pair: l_symbol,
			grid_no: grid,
			price_range:
				Number(ticker?.l).toFixed(2) + ' - ' + Number(ticker?.h).toFixed(2),
			last_price: ticker?.c,
			robot_id: aiRobot?._id,
			auto_create: autoCreate,
		};
		editAiRobot(data);
	};

	useEffect(() => {
		if (isError && error) {
			toast.error((error as fetchBaseQueryError).data.message);
		}
		if (isSuccess) {
			refetch();
			toast.success('Ai-Robot created successfully');
			setAmount(0);
			setGrid(1);
			router.push('/ai-robot');
		}
	}, [isError, isSuccess, error]);

	useEffect(() => {
		if (e_isError && e_error) {
			toast.error((e_error as fetchBaseQueryError).data.message);
		}
		if (e_isSuccess) {
			toast.success('Ai-Robot updated successfully');
			router.push('/ai-robot');
		}
	}, [e_isError, e_isSuccess, e_error]);

	return (
		<Layout>
			<ProtectedRoute>
				<div className='px-2 py-36 ai-wrapper'>
					{/* <div className='ai-overlay'></div> */}
					<div className='relative px-4 py-6 mx-auto space-y-4 rounded-lg bg-black_2 md:w-7/12'>
						<div>
							<RobotHeader ticker={ticker2} setOpen={setOpen} open={open} />
						</div>
						{/* Start Price Range */}
						<div>
							<h2 className='my-2'>1. Price Range</h2>
							<div className='grid grid-cols-2 gap-x-4 '>
								<div className='space-y-2 '>
									<p className=' text-blue-gray-300'>Lower Price</p>
									<div className='flex items-center p-2 pl-4 space-x-2 rounded-md bg-black_3 '>
										{ticker?.lowPrice ? (
											<p className=' text-blue-gray-100'>
												{Number(ticker?.lowPrice).toLocaleString('en-US', {
													minimumFractionDigits: 3,
												})}
											</p>
										) : (
											<div className='flex items-center justify-center mt-3 '>
												<BeatLoader size={5} color={'#fff'} />
											</div>
										)}
									</div>
								</div>
								<div className='space-y-2 '>
									<p className=' text-blue-gray-300'>Upper Price</p>
									<div className='flex items-center p-2 pl-4 space-x-2 rounded-md bg-black_3 '>
										{ticker?.highPrice ? (
											<p className=' text-blue-gray-100'>
												{Number(ticker?.highPrice).toLocaleString('en-US', {
													minimumFractionDigits: 3,
												})}
											</p>
										) : (
											<div className='flex items-center justify-center mt-3 '>
												<BeatLoader size={5} color={'#fff'} />
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
						{/* End Price Range */}

						<div>
							<div className='flex items-center justify-between '>
								<h2 className=''>2. Investment</h2>
								<div className='flex items-center pr-2 my-2 text-xs gap-x-1'>
									Avbl:{' '}
									<span
										className={`text-blue-gray-300 ${
											user?.ai_balance < amount && 'text-red-500'
										}`}
									>
										{Number(user?.ai_balance).toLocaleString('en-US', {
											minimumFractionDigits: 4,
										})}{' '}
										USDT
									</span>
									<span onClick={handleOpen}>
										<AiFillPlusCircle className='inline-block w-4 h-4 text-green-700 cursor-pointer' />
									</span>
								</div>
							</div>
							<div className='relative '>
								<input
									type='number'
									value={amount}
									placeholder={`=> ${minAmount}`}
									className={`w-full p-2 rounded-md ${
										stateError && 'border border-red-500'
									} outline-none bg-black_3 placeholder-blue-gray-400`}
									onChange={handleSetAmount}
								/>
								<span className='absolute right-3 top-2 text-blue-gray-200'>
									USDT
								</span>
							</div>

							{stateError && (
								<small>
									<span className='ml-1 text-red-500'>{errorText}</span>
								</small>
							)}
						</div>

						{/* Start Advance Option */}

						{/* End Advance Option */}

						{/* Start Submit Button */}
						<div className='my-4 '>
							<button
								className='w-full py-2 font-bold text-gray-100 bg-green-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed '
								disabled={
									stateError ||
									!ticker?.lowPrice ||
									!ticker?.highPrice ||
									user?.ai_balance < amount ||
									!amount ||
									!grid ||
									isLoading ||
									e_isLoading ||
									!is_ai_robot
								}
								onClick={mode === 'edit' ? handleEditRobot : handleCreateRobot}
							>
								{mode === 'edit' ? (
									'Update Robot'
								) : isLoading ? (
									<ScaleLoader color='#fff' height={20} width={3} radius={2} />
								) : (
									'Create Robot'
								)}
							</button>
						</div>
						{/* End Submit Button */}
					</div>
					<Market open={open} setOpen={setOpen} tickers={tickers} />
				</div>
				<>
					<Dialog
						open={openModal}
						handler={handleOpen}
						size='xs'
						className='px-0 overflow-auto text-white bg-black_2'
					>
						<div className='px-2 py-3 '>
							<h4 className='text-xl font-bold text-blue-gray-300'>
								Increase Balance
							</h4>
							<p className='text-xs text-blue-gray-400'>
								Unable to place order due to insufficient balance or want to
								increase balance. Convert assets from other wallet or deposit
								funds to place an order.
							</p>
							<IoCloseCircleOutline
								className='absolute text-2xl cursor-pointer text-blue-gray-600 right-3 top-2 hover:text-red-500'
								onClick={handleOpen}
							/>
						</div>
						<hr className='my-2 border border-black_3' />

						<DialogBody className='px-2 overflow-auto '>
							<div className='space-y-2 '>
								<Link
									href='/deposit'
									className='flex items-center justify-between px-2 py-2 space-x-2 rounded-md bg-black_3'
								>
									<p className='text-xs text-blue-gray-300'>Deposit</p>
									<ImDownload3 className='text-xl text-blue-gray-300' />
								</Link>
								<Link
									href='/convert'
									className='flex items-center justify-between px-2 py-2 space-x-2 rounded-md bg-black_3'
								>
									<p className='text-xs text-blue-gray-300'>Convert</p>
									<BiTransferAlt className='text-xl text-blue-gray-300' />
								</Link>
							</div>
						</DialogBody>
					</Dialog>
				</>
			</ProtectedRoute>
		</Layout>
	);
};

export default CreateRobot;
