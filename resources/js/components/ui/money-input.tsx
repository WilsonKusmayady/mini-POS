import React from "react";
import { NumericFormat, NumericFormatProps } from 'react-number-format';
import { Input } from "@/components/ui/input";

interface MoneyInputProps extends Omit<NumericFormatProps, 'customInput'> {
    className?: string;
    placeholder?: string;
    onValueChange?: (values: { floatValue?: number; value: string; formattedValue: string }) => void;
}

export function MoneyInput({ className, ...props }: MoneyInputProps) {
    return (
        <NumericFormat
        {...props}
        customInput={Input}
        thousandSeparator="."
        decimalSeparator=","
        prefix="Rp "
        allowNegative={false}
        className={className}
    />
    );
}