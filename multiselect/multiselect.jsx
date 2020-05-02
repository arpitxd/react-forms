import React from 'react';
import PropTypes from 'prop-types';

const closeIconTypes = {
    circle: 'icon_cancel_circled',
    circle2: 'icon_cancel_circled2',
    close: 'icon_window_close',
    cancel: 'icon_cancel'
};

export default class Multiselect extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            inputValue: '',
            options: props.options, // list of options
            filteredOptions: props.options, // options after search
            unfilteredOptions: props.options,
            selectedValues: Object.assign([], props.selectedValues), // selected values from backend and client
            preSelectedValues: Object.assign([], props.selectedValues),
            toggleOptionsList: false,
            highlightOption: 0,
            showCheckbox: props.showCheckbox,
            groupedObject: [],
            closeIconType: closeIconTypes[props.closeIcon] || closeIconTypes['circle']
        };
        this.searchWrapper = React.createRef();
        this.searchBox = React.createRef();
        this.onChange = this.onChange.bind(this);
        this.renderMultiselectContainer = this.renderMultiselectContainer.bind(this);
        this.renderSelectedList = this.renderSelectedList.bind(this);
        this.onRemoveSelectedItem = this.onRemoveSelectedItem.bind(this);
        this.toggelOptionList = this.toggelOptionList.bind(this);
        this.onArrowKeyNavigation = this.onArrowKeyNavigation.bind(this);
        this.onSelectItem = this.onSelectItem.bind(this);
        this.filterOptionsByInput = this.filterOptionsByInput.bind(this);
        this.removeSelectedValuesFromOptions = this.removeSelectedValuesFromOptions.bind(this);
        this.isSelectedValue = this.isSelectedValue.bind(this);
        this.fadeOutSelection = this.fadeOutSelection.bind(this);
        this.isDisablePreSelectedValues = this.isDisablePreSelectedValues.bind(this);
        this.renderGroupByOptions = this.renderGroupByOptions.bind(this);
        this.renderNormalOption = this.renderNormalOption.bind(this);
        this.listenerCallback = this.listenerCallback.bind(this);
        this.filterType1OptionsByInput = this.filterType1OptionsByInput.bind(this);
        this.filterType2OptionsByInput = this.filterType2OptionsByInput.bind(this);
        this.renderOptionForJsonType1 = this.renderOptionForJsonType1.bind(this);
        this.renderOptionForJsonType2 = this.renderOptionForJsonType2.bind(this);
    }

    componentDidMount() {
        const { showCheckbox, groupBy } = this.props;
        const { options } = this.state;
        if (!showCheckbox) {
            this.removeSelectedValuesFromOptions(false);
        }
        if (groupBy && showCheckbox) {
            this.groupByOptions(options);
        }
        this.searchWrapper.current.addEventListener('click', this.listenerCallback);
    }

    listenerCallback() {
        this.searchBox.current.focus();
    }

    componentWillUnmount() {
        this.searchWrapper.current.removeEventListener('click', this.listenerCallback);
    }

    // Skipcheck flag - value will be true when the func called from on deselect anything.
    removeSelectedValuesFromOptions(skipCheck) {
        const { isObject, displayValue, groupBy } = this.props;
        const { selectedValues = [], unfilteredOptions, options } = this.state;
        if (!skipCheck && groupBy) {
            this.groupByOptions(options);
        }
        if (!selectedValues.length && !skipCheck) {
            return;
        }
        if (isObject) {
            let optionList = unfilteredOptions.filter(item => {
                return selectedValues.findIndex(v => v[displayValue] === item[displayValue]) === -1 ? true : false;
            });
            if (groupBy) {
                this.groupByOptions(optionList);
            }
            this.setState({ options: optionList, filteredOptions: optionList }, this.filterOptionsByInput);
            return;
        }
        let optionList = unfilteredOptions.filter(item => selectedValues.indexOf(item) === -1);

        this.setState({ options: optionList, filteredOptions: optionList }, this.filterOptionsByInput);
    }

    groupByOptions(options) {
        const { groupBy } = this.props;
        const groupedObject = options.reduce(function(r, a) {
            const key = a[groupBy] || 'Others';
            r[key] = r[key] || [];
            r[key].push(a);
            return r;
        }, Object.create({}));

        this.setState({ groupedObject });
    }

    onChange(event) {
        this.setState(
            {
                inputValue: event.target.value
            },
            () => {
                this.filterOptionsByInput();
            }
        );
    }

    filterType2OptionsByInput() {
        //Consist of json with nested optgroup structure
        let { options, filteredOptions, inputValue } = this.state;
        const { isObject, displayValue } = this.props;
        if (isObject) {
            options = filteredOptions
                .filter(element =>
                    element.child.some(
                        subElement => subElement[displayValue].toLowerCase().indexOf(inputValue.toLowerCase()) > -1
                    )
                )
                .map(element => {
                    return Object.assign({}, element, {
                        child: element.child.filter(
                            subElement => subElement[displayValue].toLowerCase().indexOf(inputValue.toLowerCase()) > -1
                        )
                    });
                });
        } else {
            options = filteredOptions.filter(i => i.indexOf(inputValue) > -1);
        }
        this.groupByOptions(options);
        this.setState({ options });
    }
    filterType1OptionsByInput() {
        //Consist of json with simple structure
        let { options, filteredOptions, inputValue } = this.state;
        const { isObject, displayValue } = this.props;
        if (isObject) {
            options = filteredOptions.filter(i => i[displayValue].toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
        } else {
            options = filteredOptions.filter(i => i.indexOf(inputValue) > -1);
        }
        this.groupByOptions(options);
        this.setState({ options });
    }

    filterOptionsByInput() {
        const { JSONType } = this.props;
        switch (JSONType) {
            case 1:
                this.filterType1OptionsByInput();
                break;
            case 2:
                this.filterType2OptionsByInput();
                break;
        }
    }

    onArrowKeyNavigation(e) {
        const { options, highlightOption, toggleOptionsList, inputValue, selectedValues } = this.state;
        if (e.keyCode === 8 && !inputValue && selectedValues.length) {
            if (inputValue !== '') {
                this.onRemoveSelectedItem(selectedValues.length - 1);
            }
        }
        if (!options.length) {
            return;
        }
        if (e.keyCode === 38) {
            if (highlightOption > 0) {
                this.setState(previousState => ({
                    highlightOption: previousState.highlightOption - 1
                }));
            } else {
                this.setState({ highlightOption: options.length - 1 });
            }
        } else if (e.keyCode === 40) {
            if (highlightOption < options.length - 1) {
                this.setState(previousState => ({
                    highlightOption: previousState.highlightOption + 1
                }));
            } else {
                this.setState({ highlightOption: 0 });
            }
        } else if (e.key === 'Enter' && options.length && toggleOptionsList) {
            this.onSelectItem(options[highlightOption]);
        }
        setTimeout(() => {
            const element = document.querySelector('ul.optionContainer .highlight');
            if (element) {
                element.scrollIntoView();
            }
        });
    }

    onRemoveSelectedItem(item) {
        // when we will remove option from multiselect
        let { selectedValues, showCheckbox, index = 0, isObject } = this.state;
        const { onRemove, displayValue } = this.props;
        if (!isObject) {
            index = selectedValues.findIndex(i => i[displayValue] === item[displayValue]);
        } else {
            index = selectedValues.indexOf(item);
        }
        selectedValues.splice(index, 1);
        onRemove(selectedValues, item);
        this.setState({ selectedValues }, () => {
            if (this.state.selectedValues && this.state.selectedValues.length < 10) {
                this.setState({
                    showSelectionLimitMsg: false
                });
            }
            if (!showCheckbox) {
                this.removeSelectedValuesFromOptions(true);
            }
        });
    }

    onSelectItem(item) {
        // on option selection on multiselect
        const { selectedValues, showCheckbox } = this.state;
        const { selectionLimit, onSelect, singleSelect } = this.props;
        if (singleSelect) {
            this.onSingleSelect(item);
            onSelect([item], item);
            return;
        }
        if (this.isSelectedValue(item)) {
            this.onRemoveSelectedItem(item);
            return;
        }
        if (selectionLimit == selectedValues.length) {
            this.setState({
                showSelectionLimitMsg: true
            });
            return;
        }
        selectedValues.push(item);
        // onSelect(selectedValues, item);
        this.setState({ selectedValues }, () => {
            onSelect(selectedValues, item);
            if (!showCheckbox) {
                this.removeSelectedValuesFromOptions(true);
            }
        });
    }

    onSingleSelect(item) {
        this.setState({ selectedValues: [item], toggleOptionsList: false });
    }

    isSelectedValue(item) {
        const { isObject, displayValue } = this.props;
        const { selectedValues } = this.state;
        if (isObject) {
            return selectedValues.filter(i => i[displayValue] === item[displayValue]).length > 0;
        }
        return selectedValues.filter(i => i === item).length > 0;
    }

    renderOptionList() {
        const { groupBy, style, emptyRecordMsg } = this.props;
        const { options } = this.state;
        return (
            <ul className={`optionContainer`} style={style['optionContainer']}>
                {options.length === 0 && (
                    <span style={style['notFound']} className={`notFound`}>
                        {emptyRecordMsg}
                    </span>
                )}
                {!groupBy ? this.renderNormalOption() : this.renderGroupByOptions()}
            </ul>
        );
    }
    /* eslint-disable */
    renderGroupByOptions() {
        const { isObject = false, displayValue, showCheckbox, style, singleSelect } = this.props;
        const { groupedObject } = this.state;
        return Object.keys(groupedObject).map((obj, i) => {
            return (
                <React.Fragment>
                    <li key={i} className="groupHeading" style={style['groupHeading']}>
                        {obj}
                    </li>
                    {groupedObject[obj].map((option, i) => (
                        <li
                            key={`option${i}`}
                            style={style['option']}
                            className={`groupChildEle ${this.fadeOutSelection(option)} option`}
                            onClick={() => this.onSelectItem(option)}
                        >
                            {showCheckbox && !singleSelect && (
                                <input type="checkbox" className="checkbox" checked={this.isSelectedValue(option)} />
                            )}
                            {isObject ? option[displayValue] : option.toString()}
                        </li>
                    ))}
                </React.Fragment>
            );
        });
    }
    /* eslint-enable */
    renderNormalOption() {
        const { JSONType } = this.props;
        switch (JSONType) {
            case 1:
                return this.renderOptionForJsonType1();
            case 2:
                return this.renderOptionForJsonType2();
        }
    }

    renderOptionForJsonType2() {
        // list of multiselect options
        const { isObject = false, displayValue, showCheckbox, style, singleSelect } = this.props;
        const { highlightOption } = this.state;
        return this.state.options.map(option => (
            <li key={option.pid}>
                <span className="heading">{option.pdesc}</span>
                <ul>
                    {option.child.length &&
                        option.child.map((item, i) => (
                            <li
                                key={`item${i}`}
                                style={style['item']}
                                className={`${
                                    highlightOption === i ? `highlightOption highlight ` : ''
                                } ${this.fadeOutSelection(item)} item`}
                                onClick={() => this.onSelectItem(item)}
                            >
                                {isObject ? item[displayValue] : item.toString()}
                                {showCheckbox && !singleSelect && (
                                    <input
                                        type="checkbox"
                                        className={`checkbox-custom`}
                                        checked={this.isSelectedValue(item)}
                                        onChange={() => {}}
                                    />
                                )}
                            </li>
                        ))}
                </ul>
            </li>
        ));
    }
    renderOptionForJsonType1() {
        const { isObject = false, displayValue, showCheckbox, style, singleSelect } = this.props;
        const { highlightOption } = this.state;
        return this.state.options.map((item, i) => (
            <li
                key={`item${i}`}
                style={style['item']}
                className={`${highlightOption === i ? `highlightOption highlight` : ''} ${this.fadeOutSelection(
                    item
                )} item`}
                onClick={() => this.onSelectItem(item)}
            >
                {isObject ? item[displayValue] : item.toString()}
                {showCheckbox && !singleSelect && (
                    <input
                        type="checkbox"
                        className={`checkbox-custom`}
                        checked={this.isSelectedValue(item)}
                        onChange={() => {}}
                    />
                )}
                {!showCheckbox && singleSelect && (
                    <input
                        type="radio"
                        className={`checkbox-custom`}
                        checked={this.isSelectedValue(item)}
                        onChange={() => {}}
                    />
                )}
            </li>
        ));
    }
    renderSelectedList() {
        const { isObject = false, displayValue, style, singleSelect } = this.props;
        const { selectedValues } = this.state;
        return selectedValues.map((value, index) => (
            <span
                className={`chip  ${singleSelect} singleChip ${this.isDisablePreSelectedValues(
                    value
                )} disableSelection`}
                key={index}
                style={style['chips']}
            >
                {!isObject ? value.toString() : value[displayValue]}
                <i className={`icon_cancel closeIcon`} onClick={() => this.onRemoveSelectedItem(value)} />
            </span>
        ));
    }

    isDisablePreSelectedValues(value) {
        const { isObject, disablePreSelectedValues, displayValue } = this.props;
        const { preSelectedValues } = this.state;
        if (!disablePreSelectedValues || !preSelectedValues.length) {
            return false;
        }
        if (isObject) {
            return preSelectedValues.filter(i => i[displayValue] === value[displayValue]).length > 0;
        }
        return preSelectedValues.filter(i => i === value).length > 0;
    }

    fadeOutSelection(item) {
        const { selectionLimit, showCheckbox, singleSelect } = this.props;
        if (singleSelect) {
            return;
        }
        const { selectedValues } = this.state;
        if (selectionLimit == -1) {
            return false;
        }
        if (selectionLimit != selectedValues.length) {
            return false;
        }
        if (selectionLimit == selectedValues.length) {
            if (!showCheckbox) {
                return true;
            } else {
                if (this.isSelectedValue(item)) {
                    return false;
                }
                return true;
            }
        }
    }

    toggelOptionList() {
        this.setState({
            toggleOptionsList: !this.state.toggleOptionsList,
            highlightOption: 0
        });
    }

    componentDidUpdate(nextProps, prevState) {
        if (nextProps.selectedValues != prevState.selectedValues) {
            this.setState({ selectedValues: nextProps.selectedValues });
        }
    }

    renderMultiselectContainer() {
        const { inputValue, selectedValues } = this.state;
        const { placeholder, style, singleSelect } = this.props;
        return (
            <React.Fragment>
                <div
                    className="multiSelectContainer"
                    id="multiselectContainerReact"
                    style={style['multiselectConatiner']}
                >
                    <div
                        className={` searchWarpper ${singleSelect ? 'singleSelect' : ''}`}
                        ref={this.searchWrapper}
                        style={style['searchBox']}
                        onClick={singleSelect ? this.toggelOptionList : () => {}}
                    >
                        {/* {this.renderSelectedList()} */}
                        <input
                            type="text"
                            ref={this.searchBox}
                            className="searchBox"
                            onChange={this.onChange}
                            value={inputValue}
                            onFocus={this.toggelOptionList}
                            onBlur={() => setTimeout(this.toggelOptionList, 100)}
                            placeholder={singleSelect && selectedValues.length ? '' : placeholder}
                            onKeyDown={this.onArrowKeyNavigation}
                            style={style['inputField']}
                            disabled={singleSelect}
                        />
                        {singleSelect && <i className={`icon_cancel icon_down_dir`} />}
                    </div>
                    <div className={`optionListContainer`}>{this.renderOptionList()}</div>
                </div>
                {this.state.showSelectionLimitMsg && (
                    <div className="error_msg location_error">Max. 10 values are allowed.</div>
                )}
            </React.Fragment>
        );
    }

    render() {
        return this.renderMultiselectContainer();
    }
}

Multiselect.defaultProps = {
    options: [],
    disablePreSelectedValues: false,
    selectedValues: [],
    isObject: true,
    displayValue: 'model',
    showCheckbox: true,
    selectionLimit: -1,
    placeholder: 'Search',
    groupBy: '',
    style: {},
    emptyRecordMsg: 'No Options Available',
    onSelect: () => {},
    onRemove: () => {},
    closeIcon: 'circle2',
    singleSelect: false,
    JSONType: 1
};

Multiselect.propTypes = {
    options: PropTypes.array,
    disablePreSelectedValues: PropTypes.bool,
    selectedValues: PropTypes.array,
    isObject: PropTypes.bool,
    displayValue: PropTypes.string,
    showCheckbox: PropTypes.bool,
    selectionLimit: PropTypes.number,
    placeholder: PropTypes.string,
    groupBy: PropTypes.string,
    style: PropTypes.object,
    emptyRecordMsg: PropTypes.string,
    onSelect: PropTypes.func,
    onRemove: PropTypes.func,
    closeIcon: PropTypes.string,
    singleSelect: PropTypes.bool,
    JSONType: PropTypes.number
};
