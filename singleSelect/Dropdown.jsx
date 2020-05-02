import React, { Component } from 'react';
//import 'cssBasePath/candidate/sass/dropdown.scss';
if (sc.isFromMsite) {
    import('cssBasePath/mobile/sass/dropdown.scss');
} else {
    import('cssBasePath/candidate/sass/dropdown.scss');
}
import PropTypes from 'prop-types';

import CustomModal from 'basePath/views/components/common/modal/customModal';
/*
******How to use Dropdown with your Props*********

    placeholder: placeholder for input
    items: if you have simple list then use this props
    groupItems: if you have group list then use this props
    allowGrouping: set true if list is grouped
    onSelect: callback methods for selected values
    displayKey: key name whose value needs to be displayed
    displayId: key name of id 
    parentKey: if there is any parent key which also needs to display 
    customClass: custom class to align values as needed

******In Case you are not defining any of the props it will take default one ***
*/

export class Dropdown extends Component {
    constructor(props) {
        super(props);
        this.eachGroupRadioLi = this.eachGroupRadioLi.bind(this);
        this.eachSingleRadioLi = this.eachSingleRadioLi.bind(this);
        this.eachGroup = this.eachGroup.bind(this);
        this.state = {
            items: props.items,
            groupItems: props.groupItems,
            filteredItems: props.items.length > 0 ? props.items : props.groupItems,
            selectedStringHeader: '',
            isOpen: false,
            displayValue: props.displayValue
        };
        this.afterSelect = this.afterSelect.bind(this);
        this.onSingleSelectListItem = this.onSingleSelectListItem.bind(this);
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.renderSingleSelect = this.renderSingleSelect.bind(this);
        this.filterOptionsByInput = this.filterOptionsByInput.bind(this);
        this.onChange = this.onChange.bind(this);
        this.listenerCallback = this.listenerCallback.bind(this);
        this.dropdownRef = React.createRef();
    }

    componentWillUnmount() {
        window.removeEventListener('click', this.listenerCallback);
    }

    listenerCallback(e) {
        if (this.dropdownRef && this.dropdownRef.current.contains(e.target)) return;
        if (this.state.displayValue != this.props.displayValue) {
            this.setState({ displayValue: this.props.displayValue });
        }
        this.setState(
            { isOpen: false, filteredItems: this.props.items.length > 0 ? this.props.items : this.props.groupItems },
            () => {
                document.removeEventListener('click', this.listenerCallback);
            }
        );
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        if (prevState.displayValue != nextProps.displayValue && prevState.value == null) {
            return { displayValue: nextProps.displayValue };
        }
        return null;
    }

    eachSingleRadioLi(item, index) {
        const { displayId, displayKey, showRadio } = this.props;
        const id = displayId;
        let isSelected = this.props.defaultValue == item[id];
        return (
            <li
                key={index}
                id={`item-${id}-${index}`}
                onClick={this.onSingleSelectListItem.bind(this, item)}
                className={isSelected ? 'list-item active' : 'list-item'}
            >
                <label className="radiomark" htmlFor={'t-' + item[id]}>
                    {showRadio && (
                        <input
                            name={`radio_${this.props.id}`}
                            type="radio"
                            id={`t-${id}-${index}`}
                            defaultChecked={isSelected}
                        />
                    )}
                    {item[displayKey]}
                </label>
            </li>
        );
    }

    eachGroupRadioLi(pdesc, pid, item, index) {
        const { displayId, displayKey, showRadio } = this.props;
        const id = item[displayId] ? item[displayId] : index;
        let isSelected = this.props.defaultValue == id;
        return (
            <li
                key={index}
                id={`item-${id}-${index}`}
                onClick={this.onSingleSelectListItem.bind(this, item, pdesc)}
                className={isSelected ? 'list-item active' : 'list-item'}
            >
                <label className="radiomark" htmlFor={'t-' + id}>
                    {showRadio && (
                        <input
                            name={`radio_${this.props.id}`}
                            type="radio"
                            id={`t-${id}-${index}-${pid}`}
                            defaultChecked={isSelected}
                        />
                    )}
                    {item[displayKey]}
                </label>
            </li>
        );
    }

    eachGroup(group, index) {
        const { parentKey } = this.props;
        const pdesc = group[parentKey];
        const { pid } = group;
        return (
            <li className="groupLi" key={index}>
                <div className="groupDiv"> {pdesc} </div>
                <ul>{group.child.map(this.eachGroupRadioLi.bind(null, pdesc, pid))}</ul>
            </li>
        );
    }

    toggleDropdown(e) {
        this.setState(
            prevState => ({
                isOpen: !prevState.isOpen,
                filteredItems: this.props.items.length > 0 ? this.props.items : this.props.groupItems
            }),
            () => {
                if (this.state.isOpen) {
                    window.addEventListener('click', this.listenerCallback);
                }
            }
        );
    }

    filterOptionsByInput() {
        const inputValue = this.state.value;
        const { allowGrouping, displayKey } = this.props;
        let { items, filteredItems, groupItems } = this.state;
        if (allowGrouping) {
            filteredItems = groupItems
                .filter(element =>
                    element.child.some(
                        subElement => subElement[displayKey].toLowerCase().indexOf(inputValue.toLowerCase()) > -1
                    )
                )
                .map(element => {
                    return Object.assign({}, element, {
                        child: element.child.filter(
                            subElement => subElement[displayKey].toLowerCase().indexOf(inputValue.toLowerCase()) > -1
                        )
                    });
                });
            this.setState({ filteredItems });
        } else {
            filteredItems = items.filter(i => i[displayKey].toLowerCase().indexOf(inputValue.toLowerCase()) > -1);
            this.setState({ filteredItems });
        }
    }

    onChange(event) {
        this.setState(
            {
                value: event.target.value,
                displayValue: event.target.value,
                isOpen: true
            },
            () => {
                this.filterOptionsByInput();
            }
        );
    }

    onSingleSelectListItem(item, pdesc, e) {
        const { displayId, displayKey } = this.props;
        if (!this.props.allowGrouping) {
            if (this.props.defaultValue != item[displayKey]) {
                this.afterSelect(item[displayId], item[displayKey]);
            }
        } else {
            this.afterSelect(item[displayId], item[displayKey]);
        }
        this.toggleDropdown();
    }

    afterSelect(selectedItem, displayValue) {
        this.setState({ value: null });
        this.props.onSelect(selectedItem, displayValue);
    }

    renderSingleSelect() {
        const { filteredItems } = this.state;
        const { emptyRecordMsg, customDropDownClass } = this.props;
        if (this.props.allowGrouping) {
            return (
                <ul className={`mainUl ${customDropDownClass}`}>
                    {filteredItems.length === 0 ? (
                        <span className={`notFound`}>{emptyRecordMsg}</span>
                    ) : (
                        filteredItems.map(this.eachGroup)
                    )}
                </ul>
            );
        } else {
            return (
                <ul className={`mainUl ${customDropDownClass}`}>
                    {filteredItems.length === 0 ? (
                        <span className={`notFound`}>{emptyRecordMsg}</span>
                    ) : (
                        filteredItems.map(this.eachSingleRadioLi)
                    )}
                </ul>
            );
        }
    }

    render() {
        const { customClass, showCustomModal, customModalTitle } = this.props;
        const { displayValue } = this.state;
        return (
            <div className={`dropdowncomponent`} ref={this.dropdownRef}>
                <div className="heading ellipse" onClick={this.toggleDropdown}>
                    <input
                        type="text"
                        className={`heading-input ${customClass}`}
                        onChange={this.onChange}
                        value={displayValue}
                        placeholder={this.props.placeholder}
                    />
                </div>
                {this.state.isOpen && showCustomModal == false && this.renderSingleSelect()}
                {this.state.isOpen && showCustomModal == true && (
                    <CustomModal
                        title={customModalTitle}
                        show={this.props.showCustomModal}
                        customClass="custom_modal_class"
                        customModalContent="multi_select_modal"
                        showModalButtons={false}
                    >
                        {this.renderSingleSelect()}
                    </CustomModal>
                )}
            </div>
        );
    }
}

Dropdown.propTypes = {
    placeholder: PropTypes.string,
    groupItems: PropTypes.array,
    items: PropTypes.array,
    allowGrouping: PropTypes.bool,
    onSelect: PropTypes.func,
    displayKey: PropTypes.string,
    displayId: PropTypes.string,
    parentKey: PropTypes.string,
    customClass: PropTypes.string,
    customDropDownClass: PropTypes.string,
    showRadio: PropTypes.bool,
    emptyRecordMsg: PropTypes.string,
    defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.string,
    displayValue: PropTypes.string,
    showCustomModal: PropTypes.bool,
    customModalTitle: PropTypes.string
};

Dropdown.defaultProps = {
    placeholder: '',
    items: [],
    groupItems: [],
    allowGrouping: false,
    onSelect: () => {},
    displayKey: '',
    displayId: '',
    parentKey: '',
    customClass: '',
    showRadio: false,
    defaultValue: '',
    emptyRecordMsg: 'No Option Available',
    id: 'CustomDropDown',
    displayValue: '',
    customDropDownClass: '',
    showCustomModal: false,
    customModalTitle: ''
};
