import React from 'react'
import { Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { FormattedDate, FormattedTime, FormattedMessage } from 'react-intl'

import { server as stellar } from '../lib/Stellar'
import { withMaybe } from './shared/HOCs'
import { isDefInt, isAccount } from '../lib/Utils'

const REFRESH_RATE = 15000
const DEFAULT_LIMIT = 5

const responseToTxs = (rsp) => (
    rsp.records.map((tx) => ({
      hash: tx.hash,
      time: tx.created_at,
      opCount: tx.operation_count,
      ledger: tx.ledger_attr
    }))
)

const isLoading = (props) => (props.isLoading === true)

class TransactionRow extends React.Component {
    render() {
        const txHash = this.props.hash
        const shortHash = txHash.substring(0, 10) + "..."
        return (
            <tr>
                <td>
                    <span title={txHash}>
                        <Link to={`/tx/${txHash}`}>{shortHash}</Link>
                    </span>
                </td>
                <td><FormattedDate value={this.props.time}/> <FormattedTime value={this.props.time}/></td>
                <td>{this.props.opCount}</td>
                <td>
                    <Link to={`/ledger/${this.props.ledger}`}>{this.props.ledger}</Link>
                </td>
            </tr>
        )
    }
}

class TransactionTable extends React.Component {
    render() {
        const txRows = this.props.txs.map((tx) =>
            <TransactionRow key={tx.hash} {...tx}/>
        )

        return (
            <Table id="transaction-table" className="table-striped table-hover table-condensed">
                <thead>
                    <tr>
                        <th>#</th>
                        <th><FormattedMessage id="time" /></th>
                        <th><FormattedMessage id="operations" /></th>
                        <th><FormattedMessage id="ledger" /></th>
                    </tr>
                </thead>
                <tbody>
                    {txRows}
                </tbody>
            </Table>
        )
    }
}
const WrappedTransactionTable = withMaybe(TransactionTable, isLoading)

class TransactionTableStateWrapper extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: true,
            txs: []
        }
    }

    componentDidMount() {
        this.update()
        this.timerID = setInterval(() => this.update(), REFRESH_RATE);
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    update() {
        this.setState({
            isLoading: true,
            txs: []
        })

        const builder = stellar.transactions()

        if (isDefInt(this.props, 'ledger'))
            builder.forLedger(this.props.ledger)

        if (isAccount(this.props.account))
            builder.forAccount(this.props.account)

        const limit = (isDefInt(this.props, 'limit'))
            ? this.props.limit : DEFAULT_LIMIT
        builder.limit(limit)

        builder.order('desc')

        builder.call().then((stellarRsp) => {
            this.setState({
                txs: responseToTxs(stellarRsp),
                isLoading: false
            })
        }).catch((err) => {
            console.error(`Failed to fetch transactions: [${err}]`)
            this.setState({
                txs: [],
                isLoading: false
            })
        })
    }

    render() {
        return (
            <WrappedTransactionTable
                isLoading={this.state.isLoading}
                txs={this.state.txs}/>
        )
    }

}

export default TransactionTableStateWrapper
